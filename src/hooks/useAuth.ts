import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const { user, profile, loading, setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              preferences: userSnap.data().preferences ?? {
                aiProvider: 'openai',
                theme: 'light',
                assistantName: 'Assistant',
              },
            });
          } else {
            const defaultProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              preferences: {
                aiProvider: 'openai' as const,
                theme: 'light' as const,
                assistantName: 'Assistant',
              },
            };
            await setDoc(userRef, {
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              createdAt: new Date(),
              preferences: defaultProfile.preferences,
            });
            setProfile(defaultProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setProfile, setLoading]);

  return { user, profile, loading };
}
