import librosa
import numpy as np
from scipy.signal import butter, lfilter, find_peaks
from moviepy import VideoFileClip
import json
import os

# --- Helper: High Pass Filter Math ---
def butter_highpass(cutoff, fs, order=5):
    """
    Generates the filter coefficients.
    We filter out low frequencies (like footsteps) to keep high frequencies (racket cracks).
    """
    nyq = 0.5 * fs
    normal_cutoff = cutoff / nyq
    b, a = butter(order, normal_cutoff, btype='high', analog=False)
    return b, a

def highpass_filter(data, cutoff, fs, order=5):
    """ Applies the filter to the audio data. """
    b, a = butter_highpass(cutoff, fs, order=order)
    y = lfilter(b, a, data)
    return y

# --- Main Detection Class ---
class AudioHitDetector:
    def __init__(self, input_video_path, output_json_path):
        self.video_path = input_video_path
        self.json_path = output_json_path

    def process(self, visualize=False):
        print(f"🔊 Processing Audio for: {self.video_path}...")
        
        # 1. Extract Audio from Video
        try:
            video = VideoFileClip(self.video_path)
            audio = video.audio
            temp_audio = "temp_audio_track.wav"
            # logger=None silences the moviepy progress bar to keep terminal clean
            audio.write_audiofile(temp_audio, logger=None)
        except Exception as e:
            print(f"❌ Error extracting audio: {e}")
            return []

        # 2. Load Audio with Librosa
        # sr=44100 preserves the high-pitch 'pop' sound details
        y, sr = librosa.load(temp_audio, sr=44100)
        
        # 3. Apply High-Pass Filter (The "Sieve")
        # Removes rumble/footsteps (<1000Hz), keeps sharp hits (>1000Hz)
        y_filtered = highpass_filter(y, cutoff=1000, fs=sr, order=6)

        # 4. Convert to Decibels (The "Equalizer")
        # Makes quiet hits visible by using Logarithmic scale
        y_abs = np.abs(y_filtered)
        y_log = librosa.amplitude_to_db(y_abs, ref=np.max)

        # 5. Mute Startup Noise (The "Bug Fix")
        # Forces first 0.2s to silence to avoid detecting the video start 'pop'
        silence_frames = int(0.2 * sr)
        y_log[:silence_frames] = -80

        # 6. Peak Finding (The "Detector")
        # height=-30: Ignore background hum (air conditioning/crowd)
        # prominence=15: Only count SHARP spikes
        # distance=0.4s: Humanly impossible to hit twice in 0.4s (removes echoes)
        peaks, _ = find_peaks(
            y_log, 
            height=-30,       
            prominence=15,    
            distance=int(sr * 0.40) 
        )

        # Convert sample index to seconds
        timestamps = peaks / sr
        
        # 7. Save to JSON
        self.save_to_json(timestamps)
        
        # Cleanup temp file
        if os.path.exists(temp_audio):
            os.remove(temp_audio)

        print(f"✅ Audio Analysis Done. Found {len(timestamps)} hits.")
        return timestamps

    def save_to_json(self, timestamps):
        # Numpy floats are not JSON serializable, convert to Python list
        data = {
            "video_file": self.video_path,
            "total_hits": len(timestamps),
            "hits": [round(float(t), 2) for t in timestamps] # Round to 2 decimals
        }
        
        with open(self.json_path, 'w') as f:
            json.dump(data, f, indent=4)
        print(f"📄 Hits saved to: {self.json_path}")