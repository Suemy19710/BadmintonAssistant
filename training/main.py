import torch
import torch.nn as nn
import cv2
import numpy as np
from torchvision import models, transforms

# --- 1. Settings ---
INPUT_VIDEO = "/Users/nguyenanhvu/Documents/BadmintonAssistant/FirstTestData/InputVideo.mov"
OUTPUT_VIDEO = "/Users/nguyenanhvu/Documents/BadmintonAssistant/training/court_detection.mp4"
MODEL_PATH = "best_model.pth"
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
IMG_SIZE = 224 # Keep consistent with training.py

# --- 2. Define Model Structure ---
class CourtKeypointModel(nn.Module):
    def __init__(self, num_keypoints):
        super(CourtKeypointModel, self).__init__()
        self.backbone = models.resnet50(weights=None)
        self.backbone.fc = nn.Linear(self.backbone.fc.in_features, num_keypoints)
        
    def forward(self, x):
        return self.backbone(x)

# --- 3. Load Model ---
model = CourtKeypointModel(num_keypoints=44) 
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.to(DEVICE)
model.eval()

# Image transformation - REMOVED Resize because we handle it manually via Letterboxing
transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# --- 4. Initialize Video Handling ---
cap = cv2.VideoCapture(INPUT_VIDEO)
if not cap.isOpened():
    print(f"Error: Could not open video {INPUT_VIDEO}")
    exit()

width_orig  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height_orig = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps         = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

fourcc = cv2.VideoWriter_fourcc(*'mp4v') 
out = cv2.VideoWriter(OUTPUT_VIDEO, fourcc, fps, (width_orig, height_orig))

print(f"Processing {total_frames} frames using Letterboxing logic...")

# --- 5. Processing Loop ---
frame_count = 0
while cap.isOpened():
    ret, frame = cap.read()
    if not ret: break

    # --- STEP A: LETTERBOXING (Preprocessing) ---
    # 1. Calculate scale and new dimensions
    scale = IMG_SIZE / max(height_orig, width_orig)
    new_w, new_h = int(width_orig * scale), int(height_orig * scale)
    
    # 2. Resize and convert to RGB
    img_resized = cv2.resize(frame, (new_w, new_h))
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)

    # 3. Create black canvas and center the image
    canvas = np.zeros((IMG_SIZE, IMG_SIZE, 3), dtype=np.uint8)
    offset_x = (IMG_SIZE - new_w) // 2
    offset_y = (IMG_SIZE - new_h) // 2
    canvas[offset_y:offset_y+new_h, offset_x:offset_x+new_w] = img_rgb

    # --- STEP B: PREDICTION ---
    img_tensor = transform(canvas).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        outputs = model(img_tensor)
    
    # Normalize outputs are 0-1 relative to the 224x224 canvas
    keypoints = outputs.cpu().numpy()[0]
    
    # --- STEP C: INVERSE LETTERBOXING (Post-processing) ---
    for i in range(0, len(keypoints), 2):
        # 1. Convert normalized (0-1) to canvas pixels (0-224)
        x_canvas = keypoints[i] * IMG_SIZE
        y_canvas = keypoints[i+1] * IMG_SIZE
        
        # 2. Remove the padding (offsets) and reverse the scaling
        real_x = int((x_canvas - offset_x) / scale)
        real_y = int((y_canvas - offset_y) / scale)
        
        # Only draw if the point is within the actual frame boundaries
        if 0 <= real_x < width_orig and 0 <= real_y < height_orig:
            cv2.circle(frame, (real_x, real_y), 6, (0, 255, 0), -1)
            cv2.putText(frame, str((i//2)+1), (real_x+5, real_y-5), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    out.write(frame)
    
    frame_count += 1
    if frame_count % 50 == 0:
        print(f"Processed {frame_count}/{total_frames} frames...")

cap.release()
out.release()
print(f"Done! Output saved to: {OUTPUT_VIDEO}")