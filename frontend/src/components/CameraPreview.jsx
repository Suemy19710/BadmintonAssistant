import React, { useEffect, useRef, useState } from 'react';

const CameraPreview = ({ showGrid = false, onReady, className = "" }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          if (onReady) onReady();
        }
      } catch (err) {
        setError("Camera access denied or unavailable.");
        console.error(err);
      }
    }

    setupCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        if (stream && typeof stream.getTracks === 'function') {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, [onReady]);

  return (
    <div className={`relative bg-black overflow-hidden rounded-xl aspect-[9/16] ${className}`}>
      {error ? (
        <div className="flex items-center justify-center h-full p-6 text-center text-white">
          {error}
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      )}

      {showGrid && !error && (
        <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/50">
          <div className="grid grid-cols-3 grid-rows-3 h-full w-full">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border border-white/20" />
            ))}
          </div>
          {/* Badminton Court Mockup Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-3/4 border-2 border-dashed border-emerald-400/30 flex items-center justify-center">
              <span className="text-white/30 text-xs uppercase tracking-widest">
                Alignment Zone
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraPreview;
