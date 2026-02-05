import React from "react";
import StepContainer from "../components/StepContainer";
import PrimaryButton from "../components/PrimaryButton";

const CameraSetupScreen = ({
  currentTheme,
  theme,
  onToggleTheme,
  onBack,
  onNext,
  previewMode,
  setPreviewMode,
  demoVideoSrc,
  onSetDemoVideo,
  onSetPreviewMode,
  setDemoVideoSrc,
}) => {
  return (
    <StepContainer
      title="Camera Setup"
      currentTheme={currentTheme}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
    >
      <div className="space-y-6 flex-1 flex flex-col">
        <div className={`p-6 rounded-2xl ${currentTheme.card} border ${currentTheme.accent}`}>
          <p className={`text-sm font-bold ${currentTheme.text}`}>Choose input source</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => setPreviewMode("camera")}
              className={`p-4 rounded-2xl border text-sm font-bold ${
                previewMode === "camera"
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-white/10 bg-white/5"
              } ${currentTheme.text}`}
            >
              Use Camera
            </button>

            <button
              onClick={() => setPreviewMode("video")}
              className={`p-4 rounded-2xl border text-sm font-bold ${
                previewMode === "video"
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-white/10 bg-white/5"
              } ${currentTheme.text}`}
            >
              Use Demo Video
            </button>
          </div>

          {previewMode === "video" && (
            <div className="mt-4 space-y-2">
              <div className={`text-xs ${currentTheme.subtext}`}>
                Current demo source: <span className="font-mono">{demoVideoSrc}</span>
              </div>

             <input
                type="file"
                accept="video/*"
                className="hidden"
                id="videoUpload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = URL.createObjectURL(file);
                  onSetDemoVideo(url);      // pass this from App
                  onSetPreviewMode("video");// pass this from App
                }}
              />
            </div>
          )}
        </div>

        <div className="mt-auto">
          <PrimaryButton onClick={onNext} currentTheme={currentTheme}>
            Continue
          </PrimaryButton>
        </div>
      </div>
    </StepContainer>
  );
};

export default CameraSetupScreen;
