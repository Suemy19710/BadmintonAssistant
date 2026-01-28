import React from 'react';

const PrimaryButton = ({
  onClick,
  children,
  disabled,
  variant = 'primary',
  currentTheme,
}) => {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={
        `w-full py-4 px-6 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ` +
        (variant === 'primary'
          ? `${currentTheme.primary} ${currentTheme.primaryText} shadow-lg`
          : `${currentTheme.card} ${currentTheme.text} border ${currentTheme.accent}`)
      }
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
