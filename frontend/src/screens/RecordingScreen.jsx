import React from "react";
import StepContainer from "../components/StepContainer";
import PrimaryButton from "../components/PrimaryButton";
import CameraPreview from "../components/CameraPreview";

const RecordingScreen = ({
  currentTheme,
  theme,
  onToggleTheme,
  onBack,
  isRecording,
  timer,
  onStart,
  onStop,
  cameraRef,
  previewMode,
  demoVideoSrc,
  onTogglePreview,
}) => {
  return (
    <StepContainer
      title="Recording Session"
      currentTheme={currentTheme}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
    >
      <div className="flex-1 relative flex flex-col">
        <CameraPreview
          ref={cameraRef}
          className="flex-1"
          mode={previewMode}
          videoSrc={demoVideoSrc}
          muted={previewMode === "video"} // avoid echo
        />

        {/* toggle button */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <button
            onClick={onTogglePreview}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white/10 text-white border border-white/20 backdrop-blur"
          >
            {previewMode === "camera" ? "Use Demo Video" : "Use Camera"}
          </button>
        </div>

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            REC {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full px-6 pointer-events-none">
          {!isRecording ? (
            <div className="pointer-events-auto">
              <PrimaryButton onClick={onStart} currentTheme={currentTheme}>
                Start Session
              </PrimaryButton>
            </div>
          ) : (
            <button
              onClick={onStop}
              className="pointer-events-auto w-full bg-red-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl"
            >
              <div className="w-4 h-4 bg-white rounded-sm" />
              Stop Recording
            </button>
          )}
        </div>
      </div>
      <input
          type="file"
          accept="video/*"
          className="hidden"
          id="videoUpload"
        />

        <label
          htmlFor="videoUpload"
          className="ml-2 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 text-white border border-white/20 backdrop-blur cursor-pointer"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            // call a prop like onSetDemoVideo(url) from App
          }}
        >
          Upload Video
        </label>

    </StepContainer>
  );
};

export default RecordingScreen;
