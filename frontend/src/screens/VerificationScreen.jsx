import React from 'react';
import StepContainer from '../components/StepContainer';
import PrimaryButton from '../components/PrimaryButton';
import CameraPreview from '../components/CameraPreview';

const VerificationScreen = ({ 
  currentTheme, 
  theme, 
  onToggleTheme, 
  onBack, 
  onNext , 
  previewMode,
  cameraRef,
  demoVideoSrc

}) => {
  return (
    <StepContainer
      title="Angle Verification"
      currentTheme={currentTheme}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
     
    >
      <div className="space-y-6 flex-1 flex flex-col">
        <CameraPreview showGrid
              ref={cameraRef}
              className="flex-1 w-full h-full opacity-90"
              mode={previewMode}
              videoSrc={demoVideoSrc}
              muted={previewMode === "video"}
        />
        <div className={`p-4 rounded-xl ${currentTheme.card} flex items-center gap-4`}>
          <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
          <p className={`text-sm font-medium ${currentTheme.text}`}>AI scanning court boundaries...</p>
        </div>
        <PrimaryButton onClick={onNext} currentTheme={currentTheme}>
          {previewMode === "video" ? "Use This Video" : "Ready to Record"}
        </PrimaryButton>

      </div>
    </StepContainer>
  );
};

export default VerificationScreen;
