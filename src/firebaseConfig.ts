import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: 'AIzaSyCrc95F6sVqJ4oeHTRSWcRvLtdmOnuHTzE',
  authDomain: 'mg-dashboard-ee066.firebaseapp.com',
  projectId: 'mg-dashboard-ee066',
  storageBucket: 'mg-dashboard-ee066.firebasestorage.app',
  messagingSenderId: '703924325336',
  appId: '1:703924325336:web:408922db0fa5707a8ac0ad',
};

const app = initializeApp(firebaseConfig);

// Initialize App Check
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider('6LfzBVosAAAAAFgKc-RTjoyXZuUrLZJDM6ZQP9QT'),
  isTokenAutoRefreshEnabled: true
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };
