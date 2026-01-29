import React from 'react';
import StepContainer from '../components/StepContainer';
import PrimaryButton from '../components/PrimaryButton';

const SummaryScreen = ({
  currentTheme,
  theme,
  onToggleTheme,
  onBack,
  analysisResult,
  onSave,
  onDiscard,
}) => {
  const avg =
    Math.round(
      ((analysisResult?.scores?.reduce((acc, cur) => acc + cur.score, 0) || 0) /
        (analysisResult?.scores?.length || 1))
    ) || 0;

  return (
    <StepContainer
      title="Analysis Result"
      currentTheme={currentTheme}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
    >
      <div className="space-y-6 flex-1 overflow-y-auto pb-12">
        <div className={`p-6 rounded-3xl ${currentTheme.card} border ${currentTheme.accent} flex flex-col items-center text-center`}>
          <div className="text-6xl font-black text-emerald-500 mb-4">{avg}</div>
          <p className={`font-medium ${currentTheme.text}`}>{analysisResult?.summary}</p>
        </div>

        <div className="grid gap-3">
          {analysisResult?.scores?.map(s => (
            <div key={s.area} className={`p-4 rounded-xl ${currentTheme.card} border ${currentTheme.accent}`}>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-bold ${currentTheme.text}`}>{s.area}</span>
                <span className="text-emerald-500 font-bold">{s.score}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${s.score}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 space-y-3">
          <PrimaryButton onClick={onSave} currentTheme={currentTheme}>
            Save & Finish
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={onDiscard} currentTheme={currentTheme}>
            Discard
          </PrimaryButton>
        </div>
      </div>
    </StepContainer>
  );
};

export default SummaryScreen;
