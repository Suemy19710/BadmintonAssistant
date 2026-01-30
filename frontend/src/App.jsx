import React, { useState, useEffect, useRef } from 'react';
import { AppStep } from './constants/types'; // only keep runtime value, not TS types
import { THEMES, FOCUS_AREAS } from './constants/Setup';
import CameraPreview from './components/CameraPreview';
import ProgressDashboard from './components/ProgressDashboard';
import StepContainer from './components/StepContainer';
import PrimaryButton from './components/PrimaryButton';
import { getBadmintonAnalysis } from './services/geminiService';
import { mockDb } from './services/mockBackend';

// screens 
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import SelectTypeScreen from './screens/SelectTypeScreen';
import SelectModeScreen from './screens/SelectModeScreen';
import PlayerProfileScreen from './screens/PlayerProfileScreen';
import CameraSetupScreen from './screens/CameraSetupScreen';
import VerificationScreen from './screens/VerificationScreen';
import RecordingScreen from './screens/RecordingScreen';
import TrimmingScreen from './screens/TrimmingScreen';
import FocusSelectionScreen from './screens/FocusSelectionScreen';
import AnalyzingScreen from './screens/AnalyzingScreen';
import SummaryScreen from './screens/SummaryScreen';
import ProfileScreen from './screens/ProfileScreen';

const App=() => {
  // global overall state
  const [theme, setTheme] = useState('dark-green');
  const [step, setStep] = useState(AppStep.AUTH);
  const [currentUser, setCurrentUser] = useState(mockDb.getCurrentUser());

  // auth state 
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('')
  
  // session state
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
  // load exisiting profile if user is logged in 
  useEffect(() => {
    if (currentUser) {
      const savedProfile = mockDb.getProfile(currentUser.userId);
      if (savedProfile) {
        setProfile(savedProfile);
        setStep(AppStep.HOME);
      }
    }
  }, [currentUser]);
  // handlers 
  // handle auth check user exist
  const handleAuth = () => {
    if (authMode =="login") {
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
  const saveProfile = () => {
    if (!currentUser) return;
    mockDb.saveProfile(currentUser.userId, profile);
    setStep(AppStep.HOME);
  };


  const startRecording = () => {
    setIsRecording(true);
    setTimer(0);
    timerRef.current = window.setInterval(() => {
      setTimer(prev => prev+1);
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
      smash: analysisResult.scores.find(s => s.area === 'Smash')?.score || 50,
      clear: analysisResult.scores.find(s => s.area === 'Clear')?.score || 50,
      dropShot: analysisResult.scores.find(s => s.area === 'Drop Shot')?.score || 50,
      netPlay: analysisResult.scores.find(s => s.area === 'Net Play')?.score || 50,
      footwork: analysisResult.scores.find(s => s.area === 'Footwork')?.score || 50,
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

    // router
  switch (step) {
    case AppStep.AUTH:
      return(
        <AuthScreen
            currentTheme={currentTheme}
            authMode={authMode}
            setAuthMode={setAuthMode}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            onAuth={handleAuth}
        />
      );
    
    case AppStep.HOME:
      return(
        <HomeScreen
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          currentUser={currentUser}
          onStart={() => setStep(AppStep.SELECT_TYPE)}
          onLogout={handleLogout}
          onViewProgress={() => setStep(AppStep.PROFILE)}
        />
      );
    
    case AppStep.PROFILE:
      return (
        <ProfileScreen
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          currentUser={currentUser}
          profile={profile}
          setProfile={setProfile}
          onBack={() => setStep(AppStep.HOME)}
          onSave={saveProfile}
          onLogout={handleLogout}
        />
      );

    case AppStep.SELECT_TYPE:
      return (
        <SelectTypeScreen
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          trainingType={trainingType}
          setTrainingType={setTrainingType}
          onBack={() => setStep(AppStep.HOME)}
          onNext={() => setStep(AppStep.SELECT_MODE)}
        />
      );
    
    case AppStep.SELECT_MODE:
      return (
        <SelectModeScreen
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          gameMode={gameMode}
          setGameMode={setGameMode}
          onBack={() => setStep(AppStep.SELECT_TYPE)}
          onNext={() => setStep(AppStep.PLAYER_PROFILE)}
        />
      );
    
    case AppStep.PLAYER_PROFILE:
      return (
        <PlayerProfileScreen
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          profile={profile}
          setProfile={setProfile}
          onBack={() => setStep(AppStep.SELECT_MODE)}
          onConfirm={() => setStep(AppStep.CAMERA_SETUP)}
        />
      );

    case AppStep.CAMERA_SETUP:
      return (
        <CameraSetupScreen
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBack={() => setStep(AppStep.PLAYER_PROFILE)}
          onNext={() => setStep(AppStep.VERIFICATION)}
        />
      );
    
    case AppStep.VERIFICATION:
      return (
        <VerificationScreen
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBack={() => setStep(AppStep.CAMERA_SETUP)}
          onNext={() => setStep(AppStep.RECORDING)}
        />
      );

    case AppStep.RECORDING:
      return (
        <RecordingScreen
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBack={() => setStep(AppStep.VERIFICATION)}
          isRecording={isRecording}
          timer={timer}
          onStart={startRecording}
          onStop={stopRecording}
        />
      );

    case AppStep.TRIMMING:
      return (
        <TrimmingScreen
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBack={() => setStep(AppStep.RECORDING)}
          trimRange={trimRange}
          setTrimRange={setTrimRange}
          onNext={() => setStep(AppStep.FOCUS_SELECTION)}
        />
      );

    case AppStep.FOCUS_SELECTION:
      return (
        <FocusSelectionScreen
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBack={() => setStep(AppStep.TRIMMING)}
          selectedFocusAreas={selectedFocusAreas}
          setSelectedFocusAreas={setSelectedFocusAreas}
          isLoading={isLoading}
          onRunAnalysis={runAnalysis}
        />
      );

    case AppStep.ANALYZING:
      return <AnalyzingScreen currentTheme={currentTheme} />;

    case AppStep.SUMMARY:
      return (
        <SummaryScreen
          currentTheme={currentTheme}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBack={() => setStep(AppStep.FOCUS_SELECTION)}
          analysisResult={analysisResult}
          onSave={saveSession}
          onDiscard={() => setStep(AppStep.HOME)}
        />
      );
    default:
      return null;
  }
};
export default App;