import React from 'react';
import StepContainer from '../components/StepContainer';
import PrimaryButton from '../components/PrimaryButton';

const PlayerProfileScreen = ({
  currentTheme,
  theme,
  onToggleTheme,
  profile,
  setProfile,
  onBack,
  onConfirm,
}) => {
  return (
    <StepContainer
      title="Player Profile"
      currentTheme={currentTheme}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
    >
      <div className="space-y-6 flex-1">
        <div className="space-y-4">
          <label className={`block font-bold ${currentTheme.text}`}>Skill Level</label>
          <div className="grid grid-cols-3 gap-2">
            {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setProfile({ ...profile, skillLevel: lvl })}
                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                  profile.skillLevel === lvl
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                    : `${currentTheme.card} ${currentTheme.accent} ${currentTheme.subtext}`
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className={`block font-bold ${currentTheme.text}`}>Dominant Hand</label>
          <div className="grid grid-cols-2 gap-2">
            {['Left', 'Right'].map(h => (
              <button
                key={h}
                onClick={() => setProfile({ ...profile, dominantHand: h })}
                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                  profile.dominantHand === h
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                    : `${currentTheme.card} ${currentTheme.accent} ${currentTheme.subtext}`
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className={`block font-bold ${currentTheme.text}`}>Height (cm)</label>
          <input
            type="number"
            value={profile.height}
            onChange={e => setProfile({ ...profile, height: Number(e.target.value) })}
            className={`w-full p-4 rounded-xl outline-none border-2 ${currentTheme.card} ${currentTheme.accent} ${currentTheme.text}`}
          />
        </div>

        <div className="mt-auto pt-6">
          <PrimaryButton onClick={onConfirm} currentTheme={currentTheme}>
            Confirm Profile
          </PrimaryButton>
        </div>
      </div>
    </StepContainer>
  );
};

export default PlayerProfileScreen;
