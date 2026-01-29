import React from 'react';
import StepContainer from '../components/StepContainer';

const SelectModeScreen = ({
  currentTheme,
  theme,
  onToggleTheme,
  gameMode,
  setGameMode,
  onBack,
  onNext,
}) => {
  return (
    <StepContainer
      title="Game Mode"
      currentTheme={currentTheme}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
    >
      <div className="space-y-6 flex-1">
        <div className="grid gap-4">
          {['Single', 'Double'].map(mode => (
            <button
              key={mode}
              onClick={() => {
                setGameMode(mode);
                onNext();
              }}
              className={`p-6 rounded-2xl text-left border-2 transition-all ${
                gameMode === mode
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : `${currentTheme.card} ${currentTheme.accent}`
              }`}
            >
              <h4 className={`text-xl font-bold ${currentTheme.text}`}>{mode}</h4>
              <p className={currentTheme.subtext}>
                {mode === 'Single' ? 'One player on court.' : 'Partner training mode.'}
              </p>
            </button>
          ))}
        </div>
      </div>
    </StepContainer>
  );
};

export default SelectModeScreen;
