import torch
import torch.nn as nn
import numpy as np
import cv2
from torchvision import models

# --- Model Architecture ---
class CourtHeatmapModel(nn.Module):
    def __init__(self, num_keypoints):
        super(CourtHeatmapModel, self).__init__()
        resnet = models.resnet50(weights=None)
        self.encoder = nn.Sequential(*list(resnet.children())[:-2])
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(2048, 256, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(256), nn.ReLU(inplace=True),
            nn.ConvTranspose2d(256, 128, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(128), nn.ReLU(inplace=True),
            nn.ConvTranspose2d(128, 64, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(64), nn.ReLU(inplace=True),
            nn.Conv2d(64, num_keypoints, kernel_size=1) 
        )
        
    def forward(self, x):
        return self.decoder(self.encoder(x))

# --- Better Decoder: SOFT-ARGMAX ---
# This calculates sub-pixel accuracy instead of integer pixels
def get_soft_argmax(batch_heatmaps):
    batch_size, num_joints, h, w = batch_heatmaps.shape
    
    # Create grid
    grid_x = torch.arange(0, w, dtype=torch.float32, device=batch_heatmaps.device)
    grid_y = torch.arange(0, h, dtype=torch.float32, device=batch_heatmaps.device)
    yy, xx = torch.meshgrid(grid_y, grid_x, indexing='ij')
    
    # Flatten
    heatmaps_flat = batch_heatmaps.view(batch_size, num_joints, -1)
    
    # Apply Softmax to turn heatmaps into probability distributions
    heatmaps_flat = nn.functional.softmax(heatmaps_flat * 10, dim=2) # Scale by 10 to sharpen peaks
    
    weights = heatmaps_flat.view(batch_size, num_joints, h, w)
    
    # Weighted sum
    coords_x = (xx * weights).sum(dim=(2, 3))
    coords_y = (yy * weights).sum(dim=(2, 3))
    
    preds = torch.stack([coords_x, coords_y], dim=2).cpu().numpy()
    return preds

# --- The Pixel Refiner (The New Fix) ---
class PixelRefiner:
    def __init__(self):
        # 22 Points Model (Meters)
        W, L, S, HalfL = 6.1, 13.4, 1.98, 6.7
        self.model_points = np.array([
            [0, 0], [0.42, 0], [3.05, 0], [W - 0.42, 0], [W, 0],       
            [0, 0.76], [W, 0.76],                                      
            [0, HalfL - S], [3.05, HalfL - S], [W, HalfL - S],         
            [0, HalfL], [W, HalfL],                                    
            [0, HalfL + S], [3.05, HalfL + S], [W, HalfL + S],         
            [0, L - 0.76], [W, L - 0.76],                              
            [0, L], [0.42, L], [3.05, L], [W - 0.42, L], [W, L]        
        ], dtype=np.float32)

    def refine_with_pixels(self, image, points, window_size=40):
        """
        Looks at the high-res image around the predicted point
        and centers it on the brightest white blob.
        """
        h, w = image.shape[:2]
        corrected_points = []
        
        # Convert to grayscale for thresholding
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        for pt in points:
            cx, cy = int(pt[0]), int(pt[1])
            
            # Define ROI (Region of Interest) bounds
            x1 = max(0, cx - window_size // 2)
            y1 = max(0, cy - window_size // 2)
            x2 = min(w, cx + window_size // 2)
            y2 = min(h, cy + window_size // 2)
            
            # Crop the patch
            patch = gray[y1:y2, x1:x2]
            
            if patch.size == 0:
                corrected_points.append(pt)
                continue

            # Find white lines (Simple thresholding)
            # Badminton lines are white. We filter for bright pixels > 200
            _, thresh = cv2.threshold(patch, 180, 255, cv2.THRESH_BINARY)
            
            # Find the center of mass (Centroid) of the white pixels
            M = cv2.moments(thresh)
            if M["m00"] != 0:
                new_cx = int(M["m10"] / M["m00"])
                new_cy = int(M["m01"] / M["m00"])
                
                # Adjust global coordinates
                final_x = x1 + new_cx
                final_y = y1 + new_cy
                corrected_points.append([final_x, final_y])
            else:
                # If no white pixels found, keep original
                corrected_points.append(pt)
                
        return np.array(corrected_points)

    def snap_to_grid(self, detected_points):
        # Weighted RANSAC: Prioritize bottom points (indices 17-21)
        src_pts = detected_points.reshape(-1, 1, 2).astype(np.float32)
        dst_pts = self.model_points.reshape(-1, 1, 2)
        
        # Add extra weight to bottom corners (17, 21)
        important_indices = [17, 21] * 10
        src_weighted = np.concatenate([src_pts, src_pts[important_indices]])
        dst_weighted = np.concatenate([dst_pts, dst_pts[important_indices]])

        H, mask = cv2.findHomography(dst_weighted, src_weighted, 0) # 0 = Least Squares

        if H is None: return detected_points
        refined_pts = cv2.perspectiveTransform(dst_pts, H)
        return refined_pts.reshape(-1, 2)