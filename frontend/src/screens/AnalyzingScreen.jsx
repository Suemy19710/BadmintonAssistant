import React from 'react';

const AnalyzingScreen = ({ currentTheme }) => {
  return (
    <div className={`min-h-screen ${currentTheme.bg} flex flex-col items-center justify-center p-8 text-center`}>
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" />
      </div>
      <h2 className={`text-2xl font-bold mb-4 ${currentTheme.text}`}>Analyzing Performance</h2>
      <p className={currentTheme.subtext}>Calculating joint angles and technique efficiency...</p>
    </div>
  );
};

export default AnalyzingScreen;
