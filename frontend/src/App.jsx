import React, { useState, useEffect, useRef } from 'react';
import { AppStep } from './constants/types'; // only keep runtime value, not TS types
import { THEMES, FOCUS_AREAS } from './constants/Setup';
import CameraPreview from './components/CameraPreview';
import ProgressDashboard from './components/ProgressDashboard';
import StepContainer from './components/StepContainer';
import PrimaryButton from './components/PrimaryButton';
import { getBadmintonAnalysis } from './services/geminiService';
import { mockDb } from './services/mockBackend';

const App = () => {
  // Global State
  const [theme, setTheme] = useState('dark-green');
  const [step, setStep] = useState(AppStep.AUTH);
  const [currentUser, setCurrentUser] = useState(mockDb.getCurrentUser());

  // Auth State
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Session State
  const [trainingType, setTrainingType] = useState('Drill');
  const [gameMode, setGameMode] = useState('Single');
  const [profile, setProfile] = useState({
    skillLevel: 'Beginner',
    dominantHand: 'Right',
    height: 175,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [trimRange, setTrimRange] = useState({ start: 0, end: 100 });
  const [selectedFocusAreas, setSelectedFocusAreas] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const timerRef = useRef(null);
  const currentTheme = THEMES[theme];

  // Load existing profile if user is logged in
  useEffect(() => {
    if (currentUser) {
      const savedProfile = mockDb.getProfile(currentUser.userId);
      if (savedProfile) setProfile(savedProfile);
      setStep(AppStep.HOME);
    }
  }, [currentUser]);

  // Auth Handlers
  const handleAuth = () => {
    if (authMode === 'login') {
      const user = mockDb.login(username, password);
      if (user) {
        setCurrentUser(user);
        setStep(AppStep.HOME);
      } else {
        alert('Invalid credentials');
      }
    } else {
      const user = mockDb.signup(username, password);
      setCurrentUser(user);
      setStep(AppStep.HOME);
    }
  };

  const handleLogout = () => {
    mockDb.logout();
    setCurrentUser(null);
    setStep(AppStep.AUTH);
  };

  // Session Logic
  const startRecording = () => {
    setIsRecording(true);
    setTimer(0);
    timerRef.current = window.setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStep(AppStep.TRIMMING);
  };

  const runAnalysis = async () => {
    setIsLoading(true);
    setStep(AppStep.ANALYZING);
    try {
      const result = await getBadmintonAnalysis(profile, selectedFocusAreas, timer);
      setAnalysisResult(result);
      setStep(AppStep.SUMMARY);
    } catch (error) {
      console.error(error);
      setStep(AppStep.HOME);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSession = () => {
    if (!currentUser || !analysisResult) return;

    const scoreMap = {
      smash:
        analysisResult.scores.find(s => s.area === 'Smash')?.score || 50,
      clear:
        analysisResult.scores.find(s => s.area === 'Clear')?.score || 50,
      dropShot:
        analysisResult.scores.find(s => s.area === 'Drop Shot')?.score || 50,
      netPlay:
        analysisResult.scores.find(s => s.area === 'Net Play')?.score || 50,
      footwork:
        analysisResult.scores.find(s => s.area === 'Footwork')?.score || 50,
    };

    const matchRecord = {
      matchId: crypto.randomUUID(),
      dateTime: new Date().toISOString(),
      playerId: currentUser.userId,
      type: trainingType,
      scores: scoreMap,
      feedback: analysisResult.summary,
    };

    mockDb.saveMatch(matchRecord);
    mockDb.saveProfile(currentUser.userId, profile);
    setStep(AppStep.HOME);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark-green' ? 'white-indigo' : 'dark-green'));
  };

  // Router
  switch (step) {
    case AppStep.AUTH:
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

              <PrimaryButton
                onClick={handleAuth}
                currentTheme={currentTheme}
              >
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

    case AppStep.HOME:
      return (
        <StepContainer
          title="AI Badminton Coach"
          showBack={false}
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
        >
          <div className="flex-1 space-y-8 pb-8 overflow-y-auto">
            <div
              className={`p-8 rounded-3xl ${currentTheme.card} border ${currentTheme.accent} flex flex-col items-center text-center`}
            >
              <div
                className={`w-20 h-20 rounded-2xl ${currentTheme.bg} flex items-center justify-center mb-6 shadow-inner shuttle-pulse`}
              >
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
              <h2
                className={`text-2xl font-bold mb-2 ${currentTheme.text}`}
              >
                Welcome, {currentUser?.userName}
              </h2>
              <p className={currentTheme.subtext}>
                Ready for today's session?
              </p>
            </div>

            <div className="grid gap-4">
              <PrimaryButton
                onClick={() => setStep(AppStep.SELECT_TYPE)}
                currentTheme={currentTheme}
              >
                Start Training Session
              </PrimaryButton>
              <div className="grid grid-cols-2 gap-4">
                <PrimaryButton
                  variant="secondary"
                  onClick={() => {}}
                  currentTheme={currentTheme}
                >
                  View Progress
                </PrimaryButton>
                <PrimaryButton
                  variant="secondary"
                  onClick={handleLogout}
                  currentTheme={currentTheme}
                >
                  Log Out
                </PrimaryButton>
              </div>
            </div>

            <section>
              <h3
                className={`font-bold mb-4 ${currentTheme.text}`}
              >
                Performance History
              </h3>
              <ProgressDashboard theme={theme} />
            </section>
          </div>
        </StepContainer>
      );

    case AppStep.SELECT_TYPE:
      return (
        <StepContainer
          title="Training Type"
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBack={() => setStep(AppStep.HOME)}
        >
          <div className="space-y-6 flex-1">
            <p className={currentTheme.subtext}>
              Choose how you want to train today.
            </p>
            <div className="grid gap-4">
              {['Drill', 'Match'].map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setTrainingType(type);
                    setStep(AppStep.SELECT_MODE);
                  }}
                  className={`p-6 rounded-2xl text-left border-2 transition-all ${
                    trainingType === type
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : `${currentTheme.card} ${currentTheme.accent}`
                  }`}
                >
                  <h4
                    className={`text-xl font-bold ${currentTheme.text}`}
                  >
                    {type}
                  </h4>
                  <p className={currentTheme.subtext}>
                    {type === 'Drill'
                      ? 'Focused repetition on specific strokes.'
                      : 'Full game tactical analysis.'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </StepContainer>
      );

    case AppStep.SELECT_MODE:
      return (
        <StepContainer
          title="Game Mode"
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBack={() => setStep(AppStep.SELECT_TYPE)}
        >
          <div className="space-y-6 flex-1">
            <div className="grid gap-4">
              {['Single', 'Double'].map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    setGameMode(mode);
                    setStep(AppStep.PLAYER_PROFILE);
                  }}
                  className={`p-6 rounded-2xl text-left border-2 transition-all ${
                    gameMode === mode
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : `${currentTheme.card} ${currentTheme.accent}`
                  }`}
                >
                  <h4
                    className={`text-xl font-bold ${currentTheme.text}`}
                  >
                    {mode}
                  </h4>
                  <p className={currentTheme.subtext}>
                    {mode === 'Single'
                      ? 'One player on court.'
                      : 'Partner training mode.'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </StepContainer>
      );

    case AppStep.PLAYER_PROFILE:
      return (
        <StepContainer
          title="Player Profile"
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBack={() => setStep(AppStep.SELECT_MODE)}
        >
          <div className="space-y-6 flex-1">
            <div className="space-y-4">
              <label
                className={`block font-bold ${currentTheme.text}`}
              >
                Skill Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() =>
                      setProfile({ ...profile, skillLevel: lvl })
                    }
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
              <label
                className={`block font-bold ${currentTheme.text}`}
              >
                Dominant Hand
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Left', 'Right'].map(h => (
                  <button
                    key={h}
                    onClick={() =>
                      setProfile({ ...profile, dominantHand: h })
                    }
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
              <label
                className={`block font-bold ${currentTheme.text}`}
              >
                Height (cm)
              </label>
              <input
                type="number"
                value={profile.height}
                onChange={e =>
                  setProfile({
                    ...profile,
                    height: Number(e.target.value),
                  })
                }
                className={`w-full p-4 rounded-xl outline-none border-2 ${currentTheme.card} ${currentTheme.accent} ${currentTheme.text}`}
              />
            </div>

            <div className="mt-auto pt-6">
              <PrimaryButton
                onClick={() => setStep(AppStep.CAMERA_SETUP)}
                currentTheme={currentTheme}
              >
                Confirm Profile
              </PrimaryButton>
            </div>
          </div>
        </StepContainer>
      );

    case AppStep.CAMERA_SETUP:
      return (
        <StepContainer
          title="Camera Setup"
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBack={() => setStep(AppStep.PLAYER_PROFILE)}
        >
          <div className="space-y-8 flex-1">
            <div
              className={`p-6 rounded-2xl ${currentTheme.card} border ${currentTheme.accent}`}
            >
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <span
                    className={`w-8 h-8 rounded-full ${currentTheme.bg} flex items-center justify-center font-bold flex-shrink-0`}
                  >
                    1
                  </span>
                  <p className={currentTheme.subtext}>
                    Place iPhone on a tripod at chest height.
                  </p>
                </li>
                <li className="flex gap-4">
                  <span
                    className={`w-8 h-8 rounded-full ${currentTheme.bg} flex items-center justify-center font-bold flex-shrink-0`}
                  >
                    2
                  </span>
                  <p className={currentTheme.subtext}>
                    Ensure full court boundaries are visible.
                  </p>
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
                <p className="text-sm font-bold uppercase tracking-widest">
                  Ideal Setup View
                </p>
              </div>
            </div>

            <div className="mt-auto">
              <PrimaryButton
                onClick={() => setStep(AppStep.VERIFICATION)}
                currentTheme={currentTheme}
              >
                Continue
              </PrimaryButton>
            </div>
          </div>
        </StepContainer>
      );

    case AppStep.VERIFICATION:
      return (
        <StepContainer
          title="Angle Verification"
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBack={() => setStep(AppStep.CAMERA_SETUP)}
        >
          <div className="space-y-6 flex-1 flex flex-col">
            <CameraPreview showGrid className="flex-1" />
            <div
              className={`p-4 rounded-xl ${currentTheme.card} flex items-center gap-4`}
            >
              <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
              <p
                className={`text-sm font-medium ${currentTheme.text}`}
              >
                AI scanning court boundaries...
              </p>
            </div>
            <PrimaryButton
              onClick={() => setStep(AppStep.RECORDING)}
              currentTheme={currentTheme}
            >
              Ready to Record
            </PrimaryButton>
          </div>
        </StepContainer>
      );

    case AppStep.RECORDING:
      return (
        <StepContainer
          title="Recording Session"
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBack={() => setStep(AppStep.VERIFICATION)}
        >
          <div className="flex-1 relative flex flex-col">
            <CameraPreview className="flex-1" />

            <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                REC {Math.floor(timer / 60)}:
                {(timer % 60).toString().padStart(2, '0')}
              </div>
            </div>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full px-6 pointer-events-none">
              {!isRecording ? (
                <div className="pointer-events-auto">
                  <PrimaryButton
                    onClick={startRecording}
                    currentTheme={currentTheme}
                  >
                    Start Session
                  </PrimaryButton>
                </div>
              ) : (
                <button
                  onClick={stopRecording}
                  className="pointer-events-auto w-full bg-red-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl"
                >
                  <div className="w-4 h-4 bg-white rounded-sm" />
                  Stop Recording
                </button>
              )}
            </div>
          </div>
        </StepContainer>
      );

    case AppStep.TRIMMING:
      return (
        <StepContainer
          title="Trim Session"
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBack={() => setStep(AppStep.RECORDING)}
        >
          <div className="space-y-8 flex-1">
            <div className="aspect-[16/9] bg-slate-800 rounded-xl relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1599474924187-334a494220f1?auto=format&fit=crop&q=80&w=800"
                className="w-full h-full object-cover opacity-60"
                alt="Frame"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-white/80"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              <div
                className={`h-12 w-full ${currentTheme.card} border ${currentTheme.accent} rounded-lg relative`}
              >
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="absolute inset-0 w-full opacity-50 cursor-pointer"
                  value={trimRange.start}
                  onChange={e =>
                    setTrimRange(prev => ({
                      ...prev,
                      start: Number(e.target.value),
                    }))
                  }
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="absolute inset-0 w-full opacity-50 cursor-pointer"
                  value={trimRange.end}
                  onChange={e =>
                    setTrimRange(prev => ({
                      ...prev,
                      end: Number(e.target.value),
                    }))
                  }
                />
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500/30 border-x-2 border-emerald-500 pointer-events-none"
                  style={{
                    left: `${trimRange.start}%`,
                    right: `${100 - trimRange.end}%`,
                  }}
                />
              </div>
            </div>

            <PrimaryButton
              onClick={() => setStep(AppStep.FOCUS_SELECTION)}
              currentTheme={currentTheme}
            >
              Analyze Segment
            </PrimaryButton>
          </div>
        </StepContainer>
      );

    case AppStep.FOCUS_SELECTION:
      return (
        <StepContainer
          title="Select Focus Areas"
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBack={() => setStep(AppStep.TRIMMING)}
        >
          <div className="space-y-6 flex-1">
            <div className="grid gap-3">
              {FOCUS_AREAS.map(area => (
                <button
                  key={area}
                  onClick={() => {
                    setSelectedFocusAreas(prev =>
                      prev.includes(area)
                        ? prev.filter(a => a !== area)
                        : [...prev, area]
                    );
                  }}
                  className={`p-4 rounded-xl text-left border-2 flex items-center justify-between transition-all ${
                    selectedFocusAreas.includes(area)
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold'
                      : `${currentTheme.card} ${currentTheme.accent} ${currentTheme.text}`
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
            <div className="mt-auto">
              <PrimaryButton
                disabled={selectedFocusAreas.length === 0 || isLoading}
                onClick={runAnalysis}
                currentTheme={currentTheme}
              >
                {isLoading ? 'Analyzing…' : 'Run AI Analysis'}
              </PrimaryButton>
            </div>
          </div>
        </StepContainer>
      );

    case AppStep.ANALYZING:
      return (
        <div
          className={`min-h-screen ${currentTheme.bg} flex flex-col items-center justify-center p-8 text-center`}
        >
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <h2
            className={`text-2xl font-bold mb-4 ${currentTheme.text}`}
          >
            Analyzing Performance
          </h2>
          <p className={currentTheme.subtext}>
            Calculating joint angles and technique efficiency...
          </p>
        </div>
      );

    case AppStep.SUMMARY:
      return (
        <StepContainer
          title="Analysis Result"
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBack={() => setStep(AppStep.FOCUS_SELECTION)}
        >
          <div className="space-y-6 flex-1 overflow-y-auto pb-12">
            <div
              className={`p-6 rounded-3xl ${currentTheme.card} border ${currentTheme.accent} flex flex-col items-center text-center`}
            >
              <div className="text-6xl font-black text-emerald-500 mb-4">
                {Math.round(
                  (analysisResult?.scores?.reduce(
                    (acc, cur) => acc + cur.score,
                    0
                  ) || 0) /
                    (analysisResult?.scores?.length || 1)
                ) || 0}
              </div>
              <p className={`font-medium ${currentTheme.text}`}>
                {analysisResult?.summary}
              </p>
            </div>

            <div className="grid gap-3">
              {analysisResult?.scores?.map(s => (
                <div
                  key={s.area}
                  className={`p-4 rounded-xl ${currentTheme.card} border ${currentTheme.accent}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={`text-sm font-bold ${currentTheme.text}`}
                    >
                      {s.area}
                    </span>
                    <span className="text-emerald-500 font-bold">
                      {s.score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 space-y-3">
              <PrimaryButton
                onClick={saveSession}
                currentTheme={currentTheme}
              >
                Save & Finish
              </PrimaryButton>
              <PrimaryButton
                variant="secondary"
                onClick={() => setStep(AppStep.HOME)}
                currentTheme={currentTheme}
              >
                Discard
              </PrimaryButton>
            </div>
          </div>
        </StepContainer>
      );

    default:
      return null;
  }
};

export default App;
