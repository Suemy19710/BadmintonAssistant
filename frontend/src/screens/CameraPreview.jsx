import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

const CameraPreview = forwardRef(({ className }, ref) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getStream: () => streamRef.current,

    // used by VerificationScreen
    getFrameCanvas: () => {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null;

      if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      return canvas;
    },
  }));

  useEffect(() => {
    let stopped = false;

    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });

      if (stopped) return;

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    })();

    return () => {
      stopped = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return <video ref={videoRef} className={className} playsInline muted={false} />;
});

export default CameraPreview;
