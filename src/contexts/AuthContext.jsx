// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setUser(null);
      setRole('user');
      setLoading(false);
      return;
    }

    let timeoutId = setTimeout(() => {
      console.warn('Auth state change timeout - forcing loading to false');
      setLoading(false);
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timeoutId);
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          setRole(userDoc.exists() ? userDoc.data().role : 'user');
        } catch (error) {
          console.error('Error fetching user role:', error);
          setRole('user');
        }
      } else {
        setRole('user');
      }
      setLoading(false);
    }, (error) => {
      clearTimeout(timeoutId);
      console.error('Auth state changed error:', error);
      setUser(null);
      setRole('user');
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      if (!auth) {
        console.warn('Auth not initialized - clearing local state');
        setUser(null);
        setRole('user');
        return;
      }
      await firebaseSignOut(auth);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local state even if Firebase sign out fails
      setUser(null);
      setRole('user');
      throw error; // Re-throw so toast can handle it
    }
  };

  const value = { user, role, loading, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
