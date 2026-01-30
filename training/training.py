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

# --- Configuration ---
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
BATCH_SIZE = 16
LEARNING_RATE = 1e-4
EPOCHS = 20
IMG_SIZE = 224 # The input size for ResNet
NUM_KEYPOINTS = 22 * 2 # 22 keypoints x 2 coordinates (x, y)
ANNOTATION_FILE = '_annotations.coco.json' 
# IMPORTANT: Point this to the folder containing your images
IMAGE_DIR = '/Users/nguyenanhvu/Documents/BadmintonAssistant/training/Data' 

# --- Dataset Class ---
class BadmintonCourtDataset(Dataset):
    def __init__(self, annotation_file, img_dir, transform=None):
        self.img_dir = img_dir
        self.transform = transform
        
        with open(annotation_file, 'r') as f:
            self.coco = json.load(f)
            
        # Create a map of image_id to filename and dimensions
        self.images = {img['id']: img for img in self.coco['images']}
        self.annotations = self.coco['annotations']

    def __len__(self):
        return len(self.annotations)

    def __getitem__(self, idx):
        ann = self.annotations[idx]
        img_info = self.images[ann['image_id']]
        img_path = os.path.join(self.img_dir, img_info['file_name'])
        
        # Load Image
        image = cv2.imread(img_path)
        if image is None:
            raise FileNotFoundError(f"Image not found: {img_path}")
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Original dimensions
        orig_h, orig_w = image.shape[:2]
        
        # Resize Image
        image_resized = cv2.resize(image, (IMG_SIZE, IMG_SIZE))
        
        # --- CRITICAL STEP: Resize Keypoints ---
        # COCO keypoints are [x, y, v, x, y, v, ...]
        raw_kps = ann['keypoints']
        keypoints = []
        
        # Loop through keypoints 3 at a time (x, y, visibility)
        for i in range(0, len(raw_kps), 3):
            x, y = raw_kps[i], raw_kps[i+1]
            
            # Scale coordinates to new image size
            x_resized = x * (IMG_SIZE / orig_w)
            y_resized = y * (IMG_SIZE / orig_h)
            
            # Normalize to [0, 1] range helps training stability
            keypoints.append(x_resized / IMG_SIZE)
            keypoints.append(y_resized / IMG_SIZE)
            
        keypoints = torch.tensor(keypoints, dtype=torch.float32)
        
        if self.transform:
            image_resized = self.transform(image_resized)
            
        return image_resized, keypoints

# --- Model Definition ---
class CourtKeypointModel(nn.Module):
    def __init__(self, num_keypoints, pretrained=True):
        super(CourtKeypointModel, self).__init__()
        # Use ResNet50 as backbone (powerful enough for features)
        self.backbone = models.resnet50(pretrained=pretrained)
        
        # Modify the last layer for regression
        # ResNet50 fc in_features is 2048
        self.backbone.fc = nn.Linear(self.backbone.fc.in_features, num_keypoints)
        
    def forward(self, x):
        return self.backbone(x)

# --- Training Logic ---
def train():
    # 1. Setup Transforms (Standard ImageNet normalization)
    transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # 2. Load Data
    print(f"Loading dataset from {ANNOTATION_FILE}...")
    dataset = BadmintonCourtDataset(ANNOTATION_FILE, IMAGE_DIR, transform=transform)
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)
    
    # 3. Initialize Model
    model = CourtKeypointModel(num_keypoints=NUM_KEYPOINTS).to(device)
    
    # 4. Loss and Optimizer
    # MSELoss is standard for coordinate regression
    criterion = nn.MSELoss() 
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    print("Starting training...")
    model.train()
    
    for epoch in range(EPOCHS):
        total_loss = 0
        for images, keypoints in dataloader:
            images = images.to(device)
            keypoints = keypoints.to(device)
            
            # Forward pass
            outputs = model(images)
            loss = criterion(outputs, keypoints)
            
            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            
        avg_loss = total_loss / len(dataloader)
        print(f"Epoch [{epoch+1}/{EPOCHS}], Loss: {avg_loss:.6f}")

    # 5. Save the model
    torch.save(model.state_dict(), "badminton_court_keypoints.pth")
    print("Model saved as 'badminton_court_keypoints.pth'")

if __name__ == '__main__':
    train()