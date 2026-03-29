import { useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';

function createFallbackProfile(firebaseUser: User) {
  return {
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
}

export function useAuth() {
  const { user, profile, loading, setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // No Firebase config — skip auth listener, show unauthenticated state
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const fallbackProfile = createFallbackProfile(firebaseUser);

        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setProfile({
              ...fallbackProfile,
              preferences: userSnap.data().preferences ?? fallbackProfile.preferences,
            });
          } else {
            await setDoc(userRef, {
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              createdAt: new Date(),
              preferences: fallbackProfile.preferences,
            });
            setProfile(fallbackProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setProfile(fallbackProfile);
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
