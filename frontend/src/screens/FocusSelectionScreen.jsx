import React from 'react';
import StepContainer from '../components/StepContainer';
import PrimaryButton from '../components/PrimaryButton';
import { FOCUS_AREAS } from '../constants/Setup';

const FocusSelectionScreen = ({
  currentTheme,
  theme,
  onToggleTheme,
  onBack,
  selectedFocusAreas,
  setSelectedFocusAreas,
  isLoading,
  onRunAnalysis,
}) => {
  return (
    <StepContainer
      title="Select Focus Areas"
      currentTheme={currentTheme}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
    >
      <div className="space-y-6 flex-1">
        <div className="grid gap-3">
          {FOCUS_AREAS.map(area => (
            <button
              key={area}
              onClick={() => {
                setSelectedFocusAreas(prev =>
                  prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
                );
              }}
              className={`p-4 rounded-xl text-left border-2 flex items-center justify-between transition-all ${
                selectedFocusAreas.includes(area)
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold'
                  : `${currentTheme.card} ${currentTheme.accent} ${currentTheme.text}`
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        <div className="mt-auto">
          <PrimaryButton
            disabled={selectedFocusAreas.length === 0 || isLoading}
            onClick={onRunAnalysis}
            currentTheme={currentTheme}
          >
            {isLoading ? 'Analyzing…' : 'Run AI Analysis'}
          </PrimaryButton>
        </div>
      </div>
    </StepContainer>
  );
};

export default FocusSelectionScreen;
