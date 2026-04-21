import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthPage from './components/AuthPage';
import TripList from './components/TripList';
import TripDetail from './components/TripDetail';

/**
 * App - 主路由元件
 * AuthPage → TripList → TripDetail
 */
const App = () => {
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, isConfigured } = useAuth();
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [skippedAuth, setSkippedAuth] = useState(false);

  // 載入中
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 顯示行程詳細頁
  if (selectedTrip) {
    return (
      <TripDetail
        trip={selectedTrip}
        user={user}
        onBack={() => setSelectedTrip(null)}
      />
    );
  }

  // 未登入且未跳過 → 顯示登入頁
  if (!user && !skippedAuth && isConfigured) {
    return (
      <AuthPage
        onLogin={signInWithEmail}
        onSignup={signUpWithEmail}
        onGoogleLogin={signInWithGoogle}
        onSkip={() => setSkippedAuth(true)}
      />
    );
  }

  // 行程列表
  return (
    <TripList
      user={user}
      onSelectTrip={(trip) => setSelectedTrip(trip)}
      onSignOut={signOut}
    />
  );
};

export default App;
