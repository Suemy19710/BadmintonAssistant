const STORAGE_KEYS = {
  USERS: 'badminton_users',
  MATCHES: 'badminton_matches',
  CURRENT_USER: 'badminton_current_user',
  PROFILES: 'badminton_profiles',
};

// login()
// signup()
// getCurrentUser()
// saveProfile()
// getProfile()
// saveMatch()
// getMatches()
// logout()


function seedFakeData() {
  const existingUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  const existingMatches = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || '[]');
  const existingProfiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
  const existingCurrentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

  if (existingUsers.length > 0 || existingMatches.length > 0 || existingCurrentUser) {
    return;
  }

  const demoUser = {
    userId: 'demo-user-1',
    userName: 'demo',
    pw: 'demo123',
  };

  const demoProfile = {
    userId: demoUser.userId,
    skillLevel: 'Intermediate',
    dominantHand: 'Right',
    height: 172,
  };

  const now = new Date();

  const demoMatches = [
    {
      matchId: 'match-1',
      dateTime: '2026-01-10', 
      playerId: demoUser.userId,
      type: 'Drill',
      scores: {
        smash: 72,
        clear: 65,
        dropShot: 68,
        netPlay: 70,
        footwork: 60,
      },
      feedback: 'Solid foundation. Focus on footwork to improve court coverage.',
    },
    {
      matchId: 'match-2',
      dateTime: '2026-01-15', 
      playerId: demoUser.userId,
      type: 'Match',
      scores: {
        smash: 78,
        clear: 70,
        dropShot: 72,
        netPlay: 74,
        footwork: 65,
      },
      feedback: 'Good attacking play. Try to mix in more clears during long rallies.',
    },
    {
      matchId: 'match-3',
      dateTime: '2026-01-20', 
      playerId: demoUser.userId,
      type: 'Drill',
      scores: {
        smash: 82,
        clear: 75,
        dropShot: 80,
        netPlay: 78,
        footwork: 70,
      },
      feedback: 'Noticeable improvement in drop shots and net control. Keep practicing timing.',
    },
  ];

  const users = [demoUser];
  const profiles = { [demoUser.userId]: demoProfile };
  const matches = demoMatches;

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(demoUser));
}

// Run seeding once when module is loaded
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    seedFakeData();
  } catch (e) {
    console.warn('Could not seed fake data:', e);
  }
}

// ---- Mock DB API ----
export const mockDb = {
  // Account Table
  login: (userName, pw) => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.userName === userName && u.pw === pw);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  },

  signup: (userName, pw) => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const newUser = { userId: crypto.randomUUID(), userName, pw };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
    return newUser;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: () => {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  },

  // Player Profile Table
  saveProfile: (userId, profile) => {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    profiles[userId] = profile;
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  },

  getProfile: (userId) => {
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '{}');
    return profiles[userId] || null;
  },

  // Match & Score Breakdown Tables
  saveMatch: (match) => {
    const matches = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || '[]');
    matches.push(match);
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  },

  getMatches: (userId) => {
    const matches = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || '[]');
    return matches
      .filter(m => m.playerId === userId)
      .sort(
        (a, b) =>
          new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
      );
  },
};
