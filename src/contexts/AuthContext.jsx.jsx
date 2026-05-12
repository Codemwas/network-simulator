// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../src/firebase/config';
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

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setRole(userDoc.exists() ? userDoc.data().role : 'user');
      } else {
        setRole('user');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = () => {
    if (!auth) return Promise.resolve();
    return firebaseSignOut(auth);
  };

  const value = { user, role, loading, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
