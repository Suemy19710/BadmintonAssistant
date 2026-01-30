import React from 'react';
import StepContainer from '../components/StepContainer';
import PrimaryButton from '../components/PrimaryButton';

const ProfileScreen = ({
  currentTheme,
  theme,
  onToggleTheme,
  currentUser,
  profile,
  setProfile,
  onBack,
  onSave,
  onLogout,
}) => {
  return (
    <StepContainer
      title="Profile"
      currentTheme={currentTheme}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
    >
      <div className="space-y-6 flex-1 overflow-y-auto pb-8">
        <div className={`p-6 rounded-3xl ${currentTheme.card} border ${currentTheme.accent}`}>
          <p className={`text-sm ${currentTheme.subtext}`}>Signed in as</p>
          <p className={`text-xl font-bold ${currentTheme.text}`}>
            {currentUser?.userName || 'Unknown User'}
          </p>
        </div>

        {/* Profile Fields */}
        <div className={`p-6 rounded-3xl ${currentTheme.card} border ${currentTheme.accent} space-y-6`}>
          <div className="space-y-3">
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

          <div className="space-y-3">
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

          <div className="space-y-3">
            <label className={`block font-bold ${currentTheme.text}`}>Height (cm)</label>
            <input
              type="number"
              value={profile.height}
              onChange={e => setProfile({ ...profile, height: Number(e.target.value) })}
              className={`w-full p-4 rounded-xl outline-none border-2 ${currentTheme.bg} ${currentTheme.accent} ${currentTheme.text}`}
            />
          </div>

          <div className="grid gap-3 pt-2">
            <PrimaryButton onClick={onSave} currentTheme={currentTheme}>
              Save Profile
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={onLogout} currentTheme={currentTheme}>
              Log Out
            </PrimaryButton>
          </div>
        </div>
      </div>
    </StepContainer>
  );
};

export default ProfileScreen;
