import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCrc95F6sVqJ4oeHTRSWcRvLtdmOnuHTzE",
    authDomain: "mg-dashboard-ee066.firebaseapp.com",
    projectId: "mg-dashboard-ee066",
    storageBucket: "mg-dashboard-ee066.firebasestorage.app",
    messagingSenderId: "703924325336",
    appId: "1:703924325336:web:408922db0fa5707a8ac0ad"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);