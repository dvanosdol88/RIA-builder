import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { app } from '../firebaseConfig';
import { useAuthStore } from '../authStore';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Set custom scopes
provider.addScope('https://www.googleapis.com/auth/drive'); // Full access to Google Drive (read, write, delete, organize)
provider.addScope('https://www.googleapis.com/auth/documents'); // Edit Google Docs


export const signInWithGoogle = async () => {
  useAuthStore.getState().setLoading(true);
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential) {
      const token = credential.accessToken;
      useAuthStore.getState().setAccessToken(token || null);
      console.log('Google Access Token:', token);
    }
    useAuthStore.getState().setUser(result.user);
    return result.user;
  } catch (error) {
    console.error('Authentication error:', error);
    useAuthStore.getState().setError(error as Error);
    return null;
  }
};

export const signOut = async () => {
  useAuthStore.getState().setLoading(true);
  try {
    await firebaseSignOut(auth);
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setAccessToken(null);
  } catch (error) {
    console.error('Sign out error:', error);
    useAuthStore.getState().setError(error as Error);
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Listen for auth state changes and update the store
onAuthStateChanged(auth, (user) => {
  useAuthStore.getState().setUser(user);
});
