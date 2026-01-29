import React from "react";
import PrimaryButton from "../components/PrimaryButton";

const AuthScreen = ({
  currentTheme,
  authMode,
  setAuthMode,
  username,
  setUsername,
  password,
  setPassword,
  onAuth,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onAuth();
  };

  return (
    <div
      className={`min-h-screen ${currentTheme.bg} flex flex-col items-center justify-center p-8 transition-colors duration-300`}
    >
      <div className="w-full max-w-sm space-y-8">
        {/* header omitted for brevity */}

        <div
          className={`p-8 rounded-3xl ${currentTheme.card} border ${currentTheme.accent} shadow-xl space-y-6`}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full p-4 rounded-xl outline-none border-2 ${currentTheme.bg} ${currentTheme.accent} ${currentTheme.text} placeholder-slate-500`}
            />

            <input
              type="password"
              name="password"
              autoComplete={authMode === "login" ? "current-password" : "new-password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-4 rounded-xl outline-none border-2 ${currentTheme.bg} ${currentTheme.accent} ${currentTheme.text} placeholder-slate-500`}
            />

            <PrimaryButton type="submit" currentTheme={currentTheme}>
              {authMode === "login" ? "Sign In" : "Create Account"}
            </PrimaryButton>
          </form>

          <button
            type="button"
            onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
            className={`w-full text-center text-sm font-bold ${currentTheme.subtext}`}
          >
            {authMode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
