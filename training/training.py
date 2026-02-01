import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
from torchvision import models
import cv2
import json
import numpy as np
import os
from torchvision.models import resnet50, ResNet50_Weights

# --- Configuration ---
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
BATCH_SIZE = 16
LEARNING_RATE = 1e-4
EPOCHS = 20  # This number is for retraining, because resizing error from the second test
IMG_SIZE = 224
NUM_KEYPOINTS = 22 * 2 

# Paths for TRAINING data
TRAIN_ANNOTATION_FILE = '/Users/nguyenanhvu/Documents/BadmintonAssistant/training/Data/train/_annotations.coco.json'
TRAIN_IMAGE_DIR = '/Users/nguyenanhvu/Documents/BadmintonAssistant/training/Data/train'

# Paths for VALIDATION data
VAL_ANNOTATION_FILE = '/Users/nguyenanhvu/Documents/BadmintonAssistant/training/Data/valid/_annotations.coco.json'
VAL_IMAGE_DIR = '/Users/nguyenanhvu/Documents/BadmintonAssistant/training/Data/valid'

# --- Dataset Class (Same as before) ---
class BadmintonCourtDataset(Dataset):
    def __init__(self, annotation_file, img_dir, transform=None):
        self.img_dir = img_dir
        self.transform = transform
        
        # Verify file exists
        if not os.path.exists(annotation_file):
            raise FileNotFoundError(f"Annotation file not found: {annotation_file}")

        with open(annotation_file, 'r') as f:
            self.coco = json.load(f)
            
        self.images = {img['id']: img for img in self.coco['images']}
        self.annotations = self.coco['annotations']

    def __len__(self):
        return len(self.annotations)

    def __getitem__(self, idx):
        ann = self.annotations[idx]
        img_info = self.images[ann['image_id']]
        img_path = os.path.join(self.img_dir, img_info['file_name'])
        
        image = cv2.imread(img_path)
        if image is None:
            print(f"Warning: Could not read {img_path}. Skipping.")
            # Return a blank image and dummy keypoints or handle as preferred
            return torch.zeros((3, IMG_SIZE, IMG_SIZE)), torch.zeros(NUM_KEYPOINTS)
    
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        h, w = image.shape[:2]

        # Calculate padding to make it square without stretching
        scale = IMG_SIZE / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        image_resized = cv2.resize(image, (new_w, new_h))

        # Create black square canvas
        canvas = np.zeros((IMG_SIZE, IMG_SIZE, 3), dtype=np.uint8)
        # Center the image on the canvas
        offset_x = (IMG_SIZE - new_w) // 2
        offset_y = (IMG_SIZE - new_h) // 2
        canvas[offset_y:offset_y+new_h, offset_x:offset_x+new_w] = image_resized

        raw_kps = ann['keypoints']
        keypoints = []
        for i in range(0, len(raw_kps), 3):
            x, y = raw_kps[i], raw_kps[i+1]
            # Adjust keypoints based on scaling AND the offset (padding)
            x_new = (x * scale + offset_x) / IMG_SIZE
            y_new = (y * scale + offset_y) / IMG_SIZE
            keypoints.append(x_new)
            keypoints.append(y_new)
            
        keypoints = torch.tensor(keypoints, dtype=torch.float32)
        
        if self.transform:
            # Note: Remove Resize from your transform list since we did it manually above
            canvas = self.transform(canvas)
            
        return canvas, keypoints

# --- Model Definition ---
class CourtKeypointModel(nn.Module):
    def __init__(self, num_keypoints, pretrained=True):
        super(CourtKeypointModel, self).__init__()
        self.backbone = models.resnet50(weights=ResNet50_Weights.DEFAULT)
        self.backbone.fc = nn.Linear(self.backbone.fc.in_features, num_keypoints)
        
    def forward(self, x):
        return self.backbone(x)

# --- Training & Validation Logic ---
def train():
    # 1. Transforms
    transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # 2. Load Datasets
    print(f"Loading Training Data from {TRAIN_ANNOTATION_FILE}...")
    train_dataset = BadmintonCourtDataset(TRAIN_ANNOTATION_FILE, TRAIN_IMAGE_DIR, transform=transform)
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    
    print(f"Loading Validation Data from {VAL_ANNOTATION_FILE}...")
    val_dataset = BadmintonCourtDataset(VAL_ANNOTATION_FILE, VAL_IMAGE_DIR, transform=transform)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)
    
    # 3. Initialize Model
    model = CourtKeypointModel(num_keypoints=NUM_KEYPOINTS).to(device)
    # ADD THIS LINE to start from where you left off
    current_lr=LEARNING_RATE
    if os.path.exists("best_model.pth"):
        print("Loading existing weights to fine-tune...")
        model.load_state_dict(torch.load("best_model.pth", map_location=device))
        # Reduce LR by 10x for fine-tuning so we don't destroy previous progress
        current_lr = LEARNING_RATE / 10
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=current_lr)

    # Track best performance
    best_val_loss = float('inf')

    print(f"Starting training on {device}...")
    
    for epoch in range(EPOCHS):
        # --- TRAINING PHASE ---
        model.train()
        train_loss = 0
        for images, keypoints in train_loader:
            images = images.to(device)
            keypoints = keypoints.to(device)
            
            outputs = model(images)
            loss = criterion(outputs, keypoints)
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            
        avg_train_loss = train_loss / len(train_loader)

        # --- VALIDATION PHASE ---
        model.eval() # Set model to evaluation mode
        val_loss = 0
        with torch.no_grad(): # Don't calculate gradients for validation
            for images, keypoints in val_loader:
                images = images.to(device)
                keypoints = keypoints.to(device)
                
                outputs = model(images)
                loss = criterion(outputs, keypoints)
                val_loss += loss.item()
        
        avg_val_loss = val_loss / len(val_loader)
        
        print(f"Epoch [{epoch+1}/{EPOCHS}] | Train Loss: {avg_train_loss:.6f} | Val Loss: {avg_val_loss:.6f}")

        # --- SAVE BEST MODEL ---
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            torch.save(model.state_dict(), "best_model.pth")
            print(f"  >>> New best model saved! (Val Loss: {best_val_loss:.6f})")

    print("Training complete.")

if __name__ == '__main__':
    train()