import torch
import cv2
import numpy as np
from torchvision import transforms
from ultralytics import YOLO

# Import your clean modules
from modules import CourtHeatmapModel, PixelRefiner, get_soft_argmax
from modules import PlayerTracker

# --- Settings ---
INPUT_VIDEO = "/Users/nguyenanhvu/Documents/BadmintonAssistant/FirstTestData/InputVideo.mov"
OUTPUT_VIDEO = "/Users/nguyenanhvu/Documents/BadmintonAssistant/CourtKeypoints&PlayerTracking/output_court_players.mp4"
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
INPUT_SIZE = 224 # Or 320
HEATMAP_SIZE = 56 # Or 80

def main():
    # 1. Initialize Models
    print("Loading models...")
    court_model = CourtHeatmapModel(num_keypoints=22).to(DEVICE)
    court_model.load_state_dict(torch.load("best_heatmap_model.pth", map_location=DEVICE))
    court_model.eval()
    
    player_model = YOLO('yolov8x.pt')
    
    # 2. Setup Video
    cap = cv2.VideoCapture(INPUT_VIDEO)
    width = int(cap.get(3))
    height = int(cap.get(4))
    fps = cap.get(5)
    out = cv2.VideoWriter(OUTPUT_VIDEO, cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))
    
    # 3. Setup Tools
    transform = transforms.Compose([
        transforms.ToPILImage(), transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    refiner = PixelRefiner()

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        # --- A. Court Detection ---
        img_tensor = transform(cv2.resize(frame, (INPUT_SIZE, INPUT_SIZE))).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            preds = get_soft_argmax(court_model(img_tensor))[0]
        
        # Scale & Refine
        scale_x, scale_y = width / HEATMAP_SIZE, height / HEATMAP_SIZE
        preds[:, 0] *= scale_x
        preds[:, 1] *= scale_y
        
        court_points = refiner.refine_with_pixels(frame, preds)
        court_points = refiner.snap_to_grid(court_points)

        # Get the 4 corners for the player filter (TopLeft, TopRight, BotRight, BotLeft)
        # Adjust indices [0, 4, 21, 17] based on your specific 22-point order
        playable_area = [court_points[0], court_points[4], court_points[21], court_points[17]]

        # --- B. Player Tracking ---
        # classes=[0] filters for Person only inside YOLO
        results = player_model.track(frame, persist=True, classes=[0], verbose=False)
        
        if results[0].boxes.id is not None:
            # Convert YOLO results to a clean list
            tracks = []
            boxes = results[0].boxes.xyxy.cpu().numpy()
            ids = results[0].boxes.id.cpu().numpy()
            
            for box, track_id in zip(boxes, ids):
                # Format: [x1, y1, x2, y2, id, conf, class]
                tracks.append([box[0], box[1], box[2], box[3], track_id, 0, 0])

            # --- C. Filter Logic ---
            tracker = PlayerTracker(playable_area)
            active_players = tracker.filter_players(tracks)

            # Draw Players
            for p in active_players:
                x1, y1, x2, y2, pid = int(p[0]), int(p[1]), int(p[2]), int(p[3]), int(p[4])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f"ID: {pid}", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        # Draw Court
        for pt in court_points:
            cv2.circle(frame, (int(pt[0]), int(pt[1])), 5, (0, 0, 255), -1)

        out.write(frame)

    cap.release()
    out.release()

if __name__ == "__main__":
    main()