import React from 'react';
import PrimaryButton from './PrimaryButton';

const AuthStep = ({
  theme,
  currentTheme,
  authMode,
  setAuthMode,
  username,
  setUsername,
  password,
  setPassword,
  onAuth,
}) => {
  return (
    <div
      className={`min-h-screen ${currentTheme.bg} flex flex-col items-center justify-center p-8 transition-colors duration-300`}
    >
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div
            className={`w-24 h-24 mx-auto mb-6 rounded-3xl ${currentTheme.card} border ${currentTheme.accent} flex items-center justify-center shuttle-pulse`}
          >
            <svg
              className={currentTheme.icon}
              width="48"
              height="48"
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
          <h1
            className={`text-3xl font-black ${currentTheme.text} mb-2 tracking-tight`}
          >
            AI COACH
          </h1>
          <p className={currentTheme.subtext}>
            Your professional badminton training partner
          </p>
        </div>

        <div
          className={`p-8 rounded-3xl ${currentTheme.card} border ${currentTheme.accent} shadow-xl space-y-6`}
        >
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className={`w-full p-4 rounded-xl outline-none border-2 ${currentTheme.bg} ${currentTheme.accent} ${currentTheme.text} placeholder-slate-500`}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`w-full p-4 rounded-xl outline-none border-2 ${currentTheme.bg} ${currentTheme.accent} ${currentTheme.text} placeholder-slate-500`}
            />
          </div>

          <PrimaryButton onClick={onAuth} currentTheme={currentTheme}>
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </PrimaryButton>

          <button
            onClick={() =>
              setAuthMode(authMode === 'login' ? 'signup' : 'login')
            }
            className={`w-full text-center text-sm font-bold ${currentTheme.subtext}`}
          >
            {authMode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthStep;
