import React from 'react';
import StepContainer from '../components/StepContainer';

const SelectTypeScreen = ({
  currentTheme,
  theme,
  onToggleTheme,
  trainingType,
  setTrainingType,
  onBack,
  onNext,
}) => {
  return (
    <StepContainer
      title="Training Type"
      currentTheme={currentTheme}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
    >
      <div className="space-y-6 flex-1">
        <p className={currentTheme.subtext}>Choose how you want to train today.</p>
        <div className="grid gap-4">
          {['Drill', 'Match'].map(type => (
            <button
              key={type}
              onClick={() => {
                setTrainingType(type);
                onNext();
              }}
              className={`p-6 rounded-2xl text-left border-2 transition-all ${
                trainingType === type
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : `${currentTheme.card} ${currentTheme.accent}`
              }`}
            >
              <h4 className={`text-xl font-bold ${currentTheme.text}`}>{type}</h4>
              <p className={currentTheme.subtext}>
                {type === 'Drill'
                  ? 'Focused repetition on specific strokes.'
                  : 'Full game tactical analysis.'}
              </p>
            </button>
          ))}
        </div>
      </div>
    </StepContainer>
  );
};

export default SelectTypeScreen;
