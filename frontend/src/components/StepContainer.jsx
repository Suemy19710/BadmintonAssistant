import React from 'react';

const StepContainer = ({
  children,
  title,
  showBack = true,
  currentTheme,
  theme,
  onToggleTheme,
  onBack,
}) => {
  return (
    <div className={`min-h-screen ${currentTheme.bg} flex flex-col p-6 transition-colors duration-300`}>
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {showBack && onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-full ${currentTheme.card} ${currentTheme.text}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          <h1 className={`text-xl font-bold ${currentTheme.text}`}>{title}</h1>
        </div>

        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-full ${currentTheme.card} ${currentTheme.text}`}
        >
          {theme === 'dark-green' ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>
      </header>

      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
};

export default StepContainer;
