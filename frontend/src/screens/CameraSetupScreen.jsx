import React from 'react';
import StepContainer from '../components/StepContainer';
import PrimaryButton from '../components/PrimaryButton';

const CameraSetupScreen = ({ currentTheme, theme, onToggleTheme, onBack, onNext }) => {
  return (
    <StepContainer
      title="Camera Setup"
      currentTheme={currentTheme}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
    >
      <div className="space-y-8 flex-1">
        <div className={`p-6 rounded-2xl ${currentTheme.card} border ${currentTheme.accent}`}>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <span className={`w-8 h-8 rounded-full ${currentTheme.bg} flex items-center justify-center font-bold flex-shrink-0`}>
                1
              </span>
              <p className={currentTheme.subtext}>Place iPhone on a tripod at chest height.</p>
            </li>
            <li className="flex gap-4">
              <span className={`w-8 h-8 rounded-full ${currentTheme.bg} flex items-center justify-center font-bold flex-shrink-0`}>
                2
              </span>
              <p className={currentTheme.subtext}>Ensure full court boundaries are visible.</p>
            </li>
          </ul>
        </div>

        <div className="aspect-[16/10] bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden relative">
          <img
            src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800"
            className="opacity-50 object-cover w-full h-full"
            alt="Guidance"
          />
          <div className="absolute text-white text-center p-4">
            <p className="text-sm font-bold uppercase tracking-widest">Ideal Setup View</p>
          </div>
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
