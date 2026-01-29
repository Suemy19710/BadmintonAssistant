import React from 'react';
import StepContainer from '../components/StepContainer';
import PrimaryButton from '../components/PrimaryButton';
import ProgressDashboard from '../components/ProgressDashboard';

const HomeScreen = ({
  currentTheme,
  theme,
  onToggleTheme,
  currentUser,
  onStart,
  onLogout,
}) => {
  return (
    <StepContainer
      title="AI Badminton Coach"
      showBack={false}
      currentTheme={currentTheme}
      theme={theme}
      onToggleTheme={onToggleTheme}
    >
      <div className="flex-1 space-y-8 pb-8 overflow-y-auto">
        <div className={`p-8 rounded-3xl ${currentTheme.card} border ${currentTheme.accent} flex flex-col items-center text-center`}>
          <div className={`w-20 h-20 rounded-2xl ${currentTheme.bg} flex items-center justify-center mb-6 shadow-inner shuttle-pulse`}>
            <svg
              className={currentTheme.icon}
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 11a9 9 0 0 1 9 9" />
              <path d="M4 4a16 16 0 0 1 16 16" />
              <circle cx="5" cy="19" r="1" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${currentTheme.text}`}>
            Welcome, {currentUser?.userName}
          </h2>
          <p className={currentTheme.subtext}>Ready for today's session?</p>
        </div>

        <div className="grid gap-4">
          <PrimaryButton onClick={onStart} currentTheme={currentTheme}>
            Start Training Session
          </PrimaryButton>
          <div className="grid grid-cols-2 gap-4">
            <PrimaryButton variant="secondary" onClick={() => {}} currentTheme={currentTheme}>
              View Progress
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={onLogout} currentTheme={currentTheme}>
              Log Out
            </PrimaryButton>
          </div>
        </div>

        <section>
          <h3 className={`font-bold mb-4 ${currentTheme.text}`}>Performance History</h3>
          <ProgressDashboard theme={theme} />
        </section>
      </div>
    </StepContainer>
  );
};

export default HomeScreen;
