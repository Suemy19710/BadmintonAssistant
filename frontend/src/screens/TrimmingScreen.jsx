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
          <img
            src="https://images.unsplash.com/photo-1599474924187-334a494220f1?auto=format&fit=crop&q=80&w=800"
            className="w-full h-full object-cover opacity-60"
            alt="Frame"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-16 h-16 text-white/80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
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
