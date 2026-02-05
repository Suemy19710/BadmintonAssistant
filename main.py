import torch
import cv2
import numpy as np
import json
from torchvision import transforms
from ultralytics import YOLO
import os

# Import your modules
from modules.court import CourtHeatmapModel, PixelRefiner, get_soft_argmax
from modules.players import PlayerTracker
from modules.audio import AudioHitDetector

# --- Settings ---
INPUT_VIDEO = "/Users/nguyenanhvu/Documents/BadmintonAssistant/FirstTestData/InputVideo.mov"
OUTPUT_VIDEO = "/Users/nguyenanhvu/Documents/BadmintonAssistant/CourtKeypoints&PlayerTracking/output_final.mp4"
AUDIO_JSON_PATH = "/Users/nguyenanhvu/Documents/BadmintonAssistant/HitsDetection/detected_hits.json" # Where to save audio data
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
INPUT_SIZE = 224 
HEATMAP_SIZE = 56 

def main():
    # --- STEP 0: RUN AUDIO ANALYSIS FIRST ---
    # We do this before opening the video loop because it's fast
    if not os.path.exists(AUDIO_JSON_PATH):
        audio_detector = AudioHitDetector(INPUT_VIDEO, AUDIO_JSON_PATH)
        hit_timestamps = audio_detector.process()
    else:
        print("📄 Audio JSON exists. Loading...")
        with open(AUDIO_JSON_PATH, 'r') as f:
            data = json.load(f)
            hit_timestamps = data['hits']

    # 1. Initialize Models
    print("Loading AI models...")
    court_model = CourtHeatmapModel(num_keypoints=22).to(DEVICE)
    court_model.load_state_dict(torch.load("best_heatmap_model.pth", map_location=DEVICE))
    court_model.eval()
    
    player_model = YOLO('yolov8x.pt')
    
    # 2. Setup Video
    cap = cv2.VideoCapture(INPUT_VIDEO)
    width = int(cap.get(3))
    height = int(cap.get(4))
    fps = cap.get(5)
    out = cv2.VideoWriter(OUTPUT_VIDEO, cv2.VideoWriter_fourcc(*'avc1'), fps, (width, height))
    
    # 3. Setup Tools
    transform = transforms.Compose([
        transforms.ToPILImage(), transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    refiner = PixelRefiner()

    print("Processing Video Frames...")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        
        # Get current time in seconds
        current_time_sec = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0

        # --- A. Court Detection ---
        img_tensor = transform(cv2.resize(frame, (INPUT_SIZE, INPUT_SIZE))).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            preds = get_soft_argmax(court_model(img_tensor))[0]
        
        scale_x, scale_y = width / HEATMAP_SIZE, height / HEATMAP_SIZE
        preds[:, 0] *= scale_x
        preds[:, 1] *= scale_y
        
        court_points = refiner.refine_with_pixels(frame, preds)
        court_points = refiner.snap_to_grid(court_points)

        playable_area = [court_points[0], court_points[4], court_points[21], court_points[17]]

        # --- B. Player Tracking ---
        results = player_model.track(frame, persist=True, classes=[0], verbose=False)
        
        if results[0].boxes.id is not None:
            tracks = []
            boxes = results[0].boxes.xyxy.cpu().numpy()
            ids = results[0].boxes.id.cpu().numpy()
            
            for box, track_id in zip(boxes, ids):
                tracks.append([box[0], box[1], box[2], box[3], track_id, 0, 0])

            tracker = PlayerTracker(playable_area)
            active_players = tracker.filter_players(tracks)

            for p in active_players:
                x1, y1, x2, y2, pid = int(p[0]), int(p[1]), int(p[2]), int(p[3]), int(p[4])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f"ID: {pid}", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        # --- C. Check for Hits ---
        # Check if the current video time is close to a detected audio hit
        for hit_time in hit_timestamps:
            # If we are within 0.1 seconds of a hit
            if abs(current_time_sec - hit_time) < 0.1:
                cv2.putText(frame, "HIT DETECTED!", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 
                            1.5, (0, 0, 255), 3)

        # Draw Court
        for pt in court_points:
            cv2.circle(frame, (int(pt[0]), int(pt[1])), 5, (0, 0, 255), -1)

        out.write(frame)

    cap.release()
    out.release()
    print("Done.")

if __name__ == "__main__":
    main()