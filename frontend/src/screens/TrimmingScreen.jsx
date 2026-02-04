import React from 'react';
import StepContainer from '../components/StepContainer';
import PrimaryButton from '../components/PrimaryButton';

const TrimmingScreen = ({
  currentTheme,
  theme,
  onToggleTheme,
  onBack,
  trimRange,
  setTrimRange,
  onNext,
  recordedUrl, 
  recordedDuration
}) => {
  return (
    <StepContainer
      title="Trim Session"
      currentTheme={currentTheme}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
    >
      <div className="space-y-8 flex-1">
        <div className="aspect-[16/9] bg-slate-800 rounded-xl relative overflow-hidden">
          {recordedUrl ? (
            <video
              src={recordedUrl}
              className="w-full h-full object-cover"
              controls
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/60">
              No recording found
            </div>
          )}
        </div>

        {/* show trim in seconds */}
        <div className={`text-xs ${currentTheme.text} opacity-70 flex justify-between`}>
          <span>Start: {((trimRange.start / 100) * recordedDuration).toFixed(1)}s</span>
          <span>End: {((trimRange.end / 100) * recordedDuration).toFixed(1)}s</span>
        </div>

        <div className="space-y-4">
          <div className={`h-12 w-full ${currentTheme.card} border ${currentTheme.accent} rounded-lg relative`}>
            <input
              type="range"
              min="0"
              max="100"
              className="absolute inset-0 w-full opacity-50 cursor-pointer"
              value={trimRange.start}
              onChange={e =>
                setTrimRange(prev => ({
                  ...prev,
                  start: Number(e.target.value),
                }))
              }
            />
            <input
              type="range"
              min="0"
              max="100"
              className="absolute inset-0 w-full opacity-50 cursor-pointer"
              value={trimRange.end}
              onChange={e =>
                setTrimRange(prev => ({
                  ...prev,
                  end: Number(e.target.value),
                }))
              }
            />
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/30 border-x-2 border-emerald-500 pointer-events-none"
              style={{
                left: `${trimRange.start}%`,
                right: `${100 - trimRange.end}%`,
              }}
            />
          </div>
        </div>

        <PrimaryButton onClick={onNext} currentTheme={currentTheme}>
          Analyze Segment
        </PrimaryButton>
      </div>
    </StepContainer>
  );
};

export default TrimmingScreen;
