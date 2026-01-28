from ultralytics import YOLO

model=YOLO("yolov8x")
results=model.track("FirstTestData/InputVideo.mov", save=True)
# print(results)
# for box in results[0].boxes:
#     print(box)