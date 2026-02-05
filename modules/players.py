import cv2
import numpy as np

class PlayerTracker:
    def __init__(self, court_corners):
        """
        court_corners: List of [TopLeft, TopRight, BottomRight, BottomLeft]
        """
        # Create a filled polygon for inclusion testing
        self.court_polygon = np.array(court_corners, dtype=np.int32)

    def is_person_on_court(self, bbox, margin=50):
        """
        Checks if the person's 'feet' are inside the court area.
        margin: pixels tolerance (allows stepping slightly out)
        """
        x1, y1, x2, y2 = bbox
        feet_x = int((x1 + x2) / 2)
        feet_y = int(y2)

        # pointPolygonTest returns positive if inside, negative if outside
        dist = cv2.pointPolygonTest(self.court_polygon, (feet_x, feet_y), True)
        return dist >= -margin

    def filter_players(self, tracks):
        """
        Filters YOLO tracks to find the 2 main players.
        tracks: List of [x1, y1, x2, y2, id, conf, cls]
        """
        candidates = []
        
        for track in tracks:
            # YOLO track format: box, id, conf, class
            # Ensure we handle different output formats safely
            box = track[:4]
            cls = track[6] 

            # 1. Class Filter (0 = Person)
            if int(cls) != 0: 
                continue

            # 2. Geometric Filter (On Court?)
            if self.is_person_on_court(box):
                area = (box[2] - box[0]) * (box[3] - box[1])
                candidates.append({'track': track, 'area': area})

        # 3. Heuristic: Sort by area (largest players usually = active players)
        # and take the top 2
        candidates.sort(key=lambda x: x['area'], reverse=True)
        
        return [c['track'] for c in candidates[:2]]