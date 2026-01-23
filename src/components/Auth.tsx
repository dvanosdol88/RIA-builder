import React, { useEffect } from 'react';
import { useAuthStore } from '../authStore';
import { signInWithGoogle, signOut, onAuthChange } from '../services/authService';
import { User as UserIcon, LogOut, AlertCircle } from 'lucide-react';

const Auth = () => {
  const { user, isLoading, error, setUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(setUser);
    return () => unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (error) {
      alert(`Authentication Error: ${error.message}`);
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="p-2 rounded-full bg-slate-700 animate-pulse w-10 h-10" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 group">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User Avatar'}
            className="w-8 h-8 rounded-full border-2 border-slate-400"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center border-2 border-slate-400">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={signOut}
          className="bg-slate-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-500"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <div className="text-red-400" title={error.message}>
          <AlertCircle className="w-5 h-5" />
        </div>
      )}
      <button
        onClick={signInWithGoogle}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-full text-sm transition-colors flex items-center gap-2"
      >
        <UserIcon className="w-4 h-4" />
        Sign In
      </button>
    </div>
  );
};

export default Auth;
