import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAUOu_m-ZSPsSdTUb78ur6JXivnDrf7H1U",
    authDomain: "product-inventory-49f57.firebaseapp.com",
    projectId: "product-inventory-49f57",
    storageBucket: "product-inventory-49f57.firebasestorage.app",
    messagingSenderId: "1085586378936",
    appId: "1:1085586378936:web:675b438905acfb8469a44d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
