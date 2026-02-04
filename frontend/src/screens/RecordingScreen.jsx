import React from 'react';
import StepContainer from '../components/StepContainer';
import PrimaryButton from '../components/PrimaryButton';
import CameraPreview from '../components/CameraPreview';

const RecordingScreen = ({
  currentTheme,
  theme,
  onToggleTheme,
  onBack,
  isRecording,
  timer,
  onStart,
  onStop,
  cameraRef
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
        <CameraPreview ref={cameraRef} className="flex-1" />

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            REC {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
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
    </StepContainer>
  );
};

export default RecordingScreen;
