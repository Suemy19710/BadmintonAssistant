import os
import torch
import torch.utils.data
import cv2
import json
import numpy as np
import torchvision.transforms.functional as F

class CourtKeypointsCoco(torch.utils.data.Dataset):
    def __init__(self, root, annotation_file, transforms=None, num_keypoints=30):
        self.root = root
        self.transforms = transforms
        self.num_keypoints = num_keypoints
        
        with open(annotation_file) as f:
            self.coco_data = json.load(f)
            
        self.ids = [img['id'] for img in self.coco_data['images']]
        # Map image_id to image info and annotations
        self.img_map = {img['id']: img for img in self.coco_data['images']}
        self.ann_map = {}
        for ann in self.coco_data['annotations']:
            img_id = ann['image_id']
            if img_id not in self.ann_map:
                self.ann_map[img_id] = []
            self.ann_map[img_id].append(ann)

    def __getitem__(self, index):
        img_id = self.ids[index]
        img_info = self.img_map[img_id]
        
        path = img_info['file_name']
        img_path = os.path.join(self.root, path)
        img = cv2.imread(img_path)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        anns = self.ann_map.get(img_id, [])
        
        boxes = []
        keypoints = []
        labels = []
        
        for ann in anns:
            xmin = ann['bbox'][0]
            ymin = ann['bbox'][1]
            w = ann['bbox'][2]
            h = ann['bbox'][3]
            boxes.append([xmin, ymin, xmin + w, ymin + h])
            
            # Keypoints
            kp = ann['keypoints']
            kp = np.array(kp).reshape(-1, 3) 
            keypoints.append(kp)
            
            # Category ID
            labels.append(ann['category_id'])

        # Convert to tensors
        if len(boxes) > 0:
            boxes = torch.as_tensor(boxes, dtype=torch.float32)
            keypoints = torch.as_tensor(np.array(keypoints), dtype=torch.float32)
            labels = torch.as_tensor(labels, dtype=torch.int64)
            
            area = (boxes[:, 3] - boxes[:, 1]) * (boxes[:, 2] - boxes[:, 0])
            iscrowd = torch.zeros((len(boxes),), dtype=torch.int64) 
        else:
            boxes = torch.zeros((0, 4), dtype=torch.float32)
            keypoints = torch.zeros((0, self.num_keypoints, 3), dtype=torch.float32)
            labels = torch.zeros((0,), dtype=torch.int64)
            area = torch.zeros((0,), dtype=torch.float32)
            iscrowd = torch.zeros((0,), dtype=torch.int64)

        target = {}
        target["boxes"] = boxes
        target["labels"] = labels
        target["keypoints"] = keypoints
        target["image_id"] = torch.tensor([img_id])
        target["area"] = area
        target["iscrowd"] = iscrowd

        if self.transforms is not None:
            img, target = self.transforms(img, target)

        return img, target

    def __len__(self):
        return len(self.ids)

class ToTensor:
    def __call__(self, img, target):
        img = F.to_tensor(img)
        return img, target

def get_transforms():
    return ToTensor()

def collate_fn(batch):
    return tuple(zip(*batch))
