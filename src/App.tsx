import React, { useState, useEffect } from 'react';
import { auth, loginWithGoogle, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import WeeklyCalendar from './components/WeeklyCalendar';
import RecipeManager from './components/RecipeManager';
import ShoppingList from './components/ShoppingList';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Ensure user document exists
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            createdAt: serverTimestamp()
          });
        }
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-rose-100 dark:shadow-none border border-slate-100 dark:border-slate-800 text-center space-y-10 animate-in fade-in zoom-in duration-500">
          <div className="relative inline-flex">
            <div className="absolute -inset-4 bg-rose-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative p-6 bg-rose-500 rounded-3xl shadow-xl shadow-rose-200 dark:shadow-none shrink-0 aspect-square">
              <Calendar className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Weekly Planner</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Organiza tus comidas, recetas y lista de la compra en un solo lugar con estilo. 🍣
            </p>
          </div>
          <div className="space-y-4">
            <Button 
              onClick={loginWithGoogle} 
              className="w-full py-8 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-rose-200 dark:hover:border-rose-500/50 transition-all cursor-pointer flex items-center justify-center gap-4 font-bold shadow-sm active:scale-[0.98]"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
              Continuar con Google
            </Button>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em]">
              Autenticación segura vía Firebase
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Layout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}>
        <div className="animate-in fade-in duration-500">
          <Routes>
            <Route path="/" element={<WeeklyCalendar />} />
            <Route path="/recipes" element={<RecipeManager />} />
            <Route path="/shopping" element={<ShoppingList />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Toaster position="bottom-right" />
      </Layout>
    </BrowserRouter>
  );
}
