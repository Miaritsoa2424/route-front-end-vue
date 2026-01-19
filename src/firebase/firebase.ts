import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCeZ8HGQDBj-acbv4etwOyWqC672L_nRE4",
  authDomain: "route-de021.firebaseapp.com",
  projectId: "route-de021",
  storageBucket: "route-de021.firebasestorage.app",
  messagingSenderId: "966944901689",
  appId: "1:966944901689:web:986b7b1ea5802b908a5be8"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Exporter auth pour l'utiliser dans l'app
export const auth = getAuth(app);
