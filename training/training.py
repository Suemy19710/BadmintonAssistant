import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
import cv2
import json
import numpy as np
import os
from tqdm import tqdm # Progress bar

# ==========================================
# 1. CONFIGURATION (MODIFY THIS SECTION)
# ==========================================

# PATHS
TRAIN_ANNOTATION_FILE = '/Users/nguyenanhvu/Documents/BadmintonAssistant/training/Data/train/_annotations.coco.json'
TRAIN_IMAGE_DIR = '/Users/nguyenanhvu/Documents/BadmintonAssistant/training/Data/train'
VAL_ANNOTATION_FILE = '/Users/nguyenanhvu/Documents/BadmintonAssistant/training/Data/valid/_annotations.coco.json'
VAL_IMAGE_DIR = '/Users/nguyenanhvu/Documents/BadmintonAssistant/training/Data/valid'
SAVE_MODEL_PATH = "best_heatmap_model.pth"

# HYPERPARAMETERS
BATCH_SIZE = 8          # Lower this if you run out of GPU memory (e.g., to 4 or 2)
LEARNING_RATE = 1e-4    # 0.0001 is a safe starting point
EPOCHS = 50             # Increase to 100 if loss is still dropping
NUM_KEYPOINTS = 22      # Based on your COCO file (22 points)

# IMAGE SETTINGS
INPUT_SIZE = 224        # Size of image fed into the model (Standard ResNet size)
OUTPUT_SIZE = 56        # Size of the output heatmap (Usually Input/4 for ResNet)
SIGMA = 3               # The "spread" of the white dot on the heatmap. 
                        
# DEVICE
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu')
print(f"Using Device: {DEVICE}")

# ==========================================
# 2. DATASET GENERATOR (THE HEATMAP MAKER)
# ==========================================
class BadmintonHeatmapDataset(Dataset):
    def __init__(self, annotation_file, img_dir, transform=None):
        self.img_dir = img_dir
        self.transform = transform
        
        # Load COCO JSON
        with open(annotation_file, 'r') as f:
            self.coco = json.load(f)
            
        # Map Image IDs to file names
        self.images = {img['id']: img for img in self.coco['images']}
        self.annotations = self.coco['annotations']

    def __len__(self):
        return len(self.annotations)

    def generate_target(self, joints, height, width, sigma):
        """
        Generates a stack of 2D Gaussian Heatmaps.
        Shape: (NUM_KEYPOINTS, height, width)
        """
        target = np.zeros((NUM_KEYPOINTS, height, width), dtype=np.float32)
        tmp_size = sigma * 3

        for i in range(NUM_KEYPOINTS):
            # Extract coordinates (these are already scaled to output heatmap size)
            x, y, v = joints[i]

            if v > 0: # If keypoint is visible
                mu_x = int(x + 0.5)
                mu_y = int(y + 0.5)
                
                # Check that point is inside the map
                if mu_x >= width or mu_y >= height or mu_x < 0 or mu_y < 0:
                    continue

                # Generate Gaussian
                ul = [int(mu_x - tmp_size), int(mu_y - tmp_size)]
                br = [int(mu_x + tmp_size + 1), int(mu_y + tmp_size + 1)]

                size = 2 * tmp_size + 1
                x_range = np.arange(0, size, 1, float)
                y_range = x_range[:, np.newaxis]
                x0 = y0 = size // 2
                
                # The Gaussian Formula
                g = np.exp(- ((x_range - x0)**2 + (y_range - y0)**2) / (2 * sigma**2))

                # Determine the intersection between Gaussian and Heatmap bounds
                g_x = max(0, -ul[0]), min(br[0], width) - ul[0]
                g_y = max(0, -ul[1]), min(br[1], height) - ul[1]
                img_x = max(0, ul[0]), min(br[0], width)
                img_y = max(0, ul[1]), min(br[1], height)

                # Paste the Gaussian onto the target heatmap
                target[i, img_y[0]:img_y[1], img_x[0]:img_x[1]] = \
                    np.maximum(target[i, img_y[0]:img_y[1], img_x[0]:img_x[1]],
                               g[g_y[0]:g_y[1], g_x[0]:g_x[1]])

        return target

    def __getitem__(self, idx):
        ann = self.annotations[idx]
        img_info = self.images[ann['image_id']]
        img_path = os.path.join(self.img_dir, img_info['file_name'])
        
        # 1. Load Image
        image = cv2.imread(img_path)
        if image is None:
            # Fallback for corrupt images
            return torch.zeros((3, INPUT_SIZE, INPUT_SIZE)), torch.zeros((NUM_KEYPOINTS, OUTPUT_SIZE, OUTPUT_SIZE))
            
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        h_orig, w_orig = image.shape[:2]

        # 2. Resize Image to Input Size (e.g. 224x224)
        image_resized = cv2.resize(image, (INPUT_SIZE, INPUT_SIZE))
        
        # 3. Process Keypoints
        raw_kps = ann['keypoints']
        scaled_kps = []
        
        # Scale factor for Heatmap (Heatmap is smaller than Input Image)
        # We map Original -> Input(224) -> Output(56)
        scale_x = OUTPUT_SIZE / w_orig
        scale_y = OUTPUT_SIZE / h_orig

        for i in range(0, len(raw_kps), 3):
            # Map raw coordinate directly to Heatmap coordinate space
            sx = raw_kps[i] * scale_x
            sy = raw_kps[i+1] * scale_y
            v = raw_kps[i+2]
            scaled_kps.append([sx, sy, v])

        # 4. Generate Heatmap Target
        heatmap_target = self.generate_target(scaled_kps, OUTPUT_SIZE, OUTPUT_SIZE, SIGMA)

        # 5. Apply Transforms (Normalization)
        if self.transform:
            image_tensor = self.transform(image_resized)
        
        return image_tensor, torch.tensor(heatmap_target)

# ==========================================
# 3. THE MODEL (RESNET + DECONVOLUTION HEAD)
# ==========================================
class CourtHeatmapModel(nn.Module):
    def __init__(self, num_keypoints):
        super(CourtHeatmapModel, self).__init__()
        # Use ResNet50 as backbone
        resnet = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
        
        # Cut off the last 2 layers (avgpool and fc) to keep spatial features
        # ResNet50 downsamples by 32x. Input 224 -> Feature Map 7x7
        self.encoder = nn.Sequential(*list(resnet.children())[:-2])
        
        # Decoder: Upsample from 7x7 -> 14x14 -> 28x28 -> 56x56
        self.decoder = nn.Sequential(
            # Block 1: 7 -> 14
            nn.ConvTranspose2d(2048, 256, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            
            # Block 2: 14 -> 28
            nn.ConvTranspose2d(256, 128, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),

            # Block 3: 28 -> 56
            nn.ConvTranspose2d(128, 64, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            
            # Final prediction layer: 56 -> 56 (Channel reduction to num_keypoints)
            nn.Conv2d(64, num_keypoints, kernel_size=1) 
        )
        
    def forward(self, x):
        features = self.encoder(x)
        heatmaps = self.decoder(features)
        return heatmaps

# ==========================================
# 4. TRAINING LOOP
# ==========================================
def train():
    # Transforms
    train_transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2), # Augmentation
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Datasets
    train_dataset = BadmintonHeatmapDataset(TRAIN_ANNOTATION_FILE, TRAIN_IMAGE_DIR, train_transform)
    val_dataset = BadmintonHeatmapDataset(VAL_ANNOTATION_FILE, VAL_IMAGE_DIR, val_transform)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

    print(f"Training on {len(train_dataset)} images, Validating on {len(val_dataset)} images")

    # Init Model
    model = CourtHeatmapModel(num_keypoints=NUM_KEYPOINTS).to(DEVICE)
    
    # Optimizer & Loss
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    criterion = nn.SmoothL1Loss() # Pixel-wise Mean Squared Error
    
    best_val_loss = float('inf')

    # Loop
    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0.0
        
        loop = tqdm(train_loader, desc=f"Epoch {epoch+1}/{EPOCHS}")
        for images, targets in loop:
            images = images.to(DEVICE)
            targets = targets.to(DEVICE) # Shape: (B, 22, 56, 56)
            
            optimizer.zero_grad()
            outputs = model(images)      # Shape: (B, 22, 56, 56)
            
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            loop.set_postfix(loss=loss.item())

        avg_train_loss = train_loss / len(train_loader)

        # Validation
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for images, targets in val_loader:
                images, targets = images.to(DEVICE), targets.to(DEVICE)
                outputs = model(images)
                loss = criterion(outputs, targets)
                val_loss += loss.item()
        
        avg_val_loss = val_loss / len(val_loader)
        
        print(f"Epoch {epoch+1} -> Train Loss: {avg_train_loss:.6f} | Val Loss: {avg_val_loss:.6f}")
        
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            torch.save(model.state_dict(), SAVE_MODEL_PATH)
            print("  >>> Saved Best Model!")

if __name__ == '__main__':
    train()