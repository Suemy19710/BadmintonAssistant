import torchvision
from torchvision.models.detection.keypoint_rcnn import KeypointRCNNPredictor
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor

def get_model(num_keypoints=30, num_classes=2, weights=None):
    model = torchvision.models.detection.keypointrcnn_resnet50_fpn(weights=weights)

    # Box predictor
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)

    # Keypoint predictor
    in_features_kp = model.roi_heads.keypoint_predictor.kps_score_lowres.in_channels
    model.roi_heads.keypoint_predictor = KeypointRCNNPredictor(
        in_features_kp, num_keypoints
    )

    return model
