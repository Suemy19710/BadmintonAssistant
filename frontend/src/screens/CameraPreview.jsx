import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

const CameraPreview = forwardRef(
  ({ className, mode = "camera", videoSrc = "", muted = false }, ref) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const canvasRef = useRef(null);

    useImperativeHandle(ref, () => ({
      getStream: () => streamRef.current,

      // Works for BOTH camera and demo video
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

      async function startCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: true,
        });

        if (stopped) return;

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      async function startVideo() {
        // stop camera if it was running
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        if (!videoSrc) return;

        videoRef.current.srcObject = null;
        videoRef.current.src = videoSrc;

        // iOS/Safari needs these
        videoRef.current.playsInline = true;
        videoRef.current.loop = true;

        await videoRef.current.play();
      }

      (async () => {
        try {
          if (mode === "camera") await startCamera();
          else await startVideo();
        } catch (e) {
          console.error("CameraPreview error:", e);
        }
      })();

      return () => {
        stopped = true;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
    }, [mode, videoSrc]);

    return (
      <video
        ref={videoRef}
        className={className}
        muted={mode === "video" ? true : muted} // demo video muted helps autoplay
        controls={mode === "video"}
        autoPlay
        playsInline
        loop={mode === "video"}
      />
    );

  }
);

export default CameraPreview;
