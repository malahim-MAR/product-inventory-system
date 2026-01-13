import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [businessData, setBusinessData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sign up with email and password
    async function signup(email, password, displayName, businessName) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update display name
        await updateProfile(user, { displayName });

        // Create business document
        const businessRef = doc(db, 'businesses', user.uid);
        await setDoc(businessRef, {
            name: businessName,
            ownerId: user.uid,
            catalogSettings: {
                isPublic: false,
                slug: businessName.toLowerCase().replace(/\s+/g, '-'),
                theme: 'default'
            },
            planId: 'free',
            planExpiresAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Create user document
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            email: user.email,
            displayName: displayName,
            businessId: user.uid,
            role: 'owner',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return userCredential;
    }

    // Sign in with email and password
    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    // Sign out
    function logout() {
        return signOut(auth);
    }

    // Fetch user and business data
    async function fetchUserData(user) {
        if (!user) {
            setUserData(null);
            setBusinessData(null);
            return;
        }

        try {
            // Fetch user document
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                setUserData(userData);

                // Fetch business document
                if (userData.businessId) {
                    const businessRef = doc(db, 'businesses', userData.businessId);
                    const businessSnap = await getDoc(businessRef);

                    if (businessSnap.exists()) {
                        setBusinessData({ id: businessSnap.id, ...businessSnap.data() });
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            await fetchUserData(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userData,
        businessData,
        businessId: userData?.businessId || currentUser?.uid,
        userRole: userData?.role || 'owner',
        signup,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
