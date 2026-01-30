import torch
import cv2
import numpy as np
from PIL import Image
import torchvision.transforms.functional as F
import time

from model import get_model

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = get_model(num_keypoints=30, num_classes=2, weights=None)
model.load_state_dict(torch.load("court_keypoints_kprcnn.pth", map_location=device))
model.to(device)
model.eval()
def load_image(path):
    img = Image.open(path).convert("RGB")
    img = F.to_tensor(img)
    return img
@torch.no_grad()
def predict(model, image_tensor):
    image_tensor = image_tensor.to(device)
    outputs = model([image_tensor])
    return outputs[0]
def draw_keypoints(frame_bgr, keypoints):
    """
    frame_bgr: OpenCV image (H,W,3) uint8
    keypoints: Tensor [M,30,3] or numpy array
    """

    img = frame_bgr.copy()  # IMPORTANT: keep OpenCV format

    for kp_set in keypoints:
        for x, y, v in kp_set:
            if v > 0:
                cv2.circle(
                    img,
                    (int(x), int(y)),
                    3,
                    (0, 255, 0),
                    -1
                )

    return img

def run_on_video(input_path, output_path):
    cap = cv2.VideoCapture(input_path)

    if not cap.isOpened():
        raise RuntimeError("Cannot open video")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps_video = cap.get(cv2.CAP_PROP_FPS)

    print(f"[INFO] Input video opened")
    print(f"[INFO] Total frames: {total_frames}")
    print(f"[INFO] Video FPS: {fps_video:.2f}")

    # Video writer setup
    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(output_path, fourcc, fps_video, (width, height))

    start_time = time.time()
    frame_idx = 0


    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # --- Keep BGR frame for drawing ---
        frame_bgr = frame.copy()

        # --- Convert for model ---
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img_tensor = F.to_tensor(frame_rgb).to(device)

        # --- Inference ---
        with torch.no_grad():
            pred = model([img_tensor])[0]

        keep = pred["scores"] >= 0.7

        if keep.sum() > 0:
            keypoints = pred["keypoints"][keep].cpu()
            frame_bgr = draw_keypoints(frame_bgr, keypoints)

        # --- Write frame to output video ---
        writer.write(frame_bgr)
        frame_idx += 1

        # --- Progress report every 50 frames ---
        if frame_idx % 50 == 0:
            elapsed = time.time() - start_time
            fps = frame_idx / elapsed if elapsed > 0 else 0
            percent = (frame_idx / total_frames) * 100 if total_frames > 0 else 0

            print(
                f"[RUNNING] "
                f"{frame_idx}/{total_frames} frames "
                f"({percent:.1f}%) | "
                f"{fps:.2f} FPS"
            )


    cap.release()
    writer.release()

    total_time = time.time() - start_time
    avg_fps = frame_idx / total_time if total_time > 0 else 0

    print("[DONE] Video processing finished")
    print(f"[DONE] Frames processed: {frame_idx}")
    print(f"[DONE] Total time: {total_time/60:.2f} minutes")
    print(f"[DONE] Average FPS: {avg_fps:.2f}")
    print(f"[DONE] Output saved to: {output_path}")



if __name__ == "__main__":
    run_on_video(
        input_path="/Users/nguyenanhvu/Documents/BadmintonAssistant/FirstTestData/InputVideo.mov",
        output_path="output_keypoints.mp4"
    )