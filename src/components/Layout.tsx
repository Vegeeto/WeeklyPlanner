import React from 'react';
import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { auth, logout } from '@/src/lib/firebase';
import { Button } from '@/components/ui/button';
import { LogOut, Calendar, Utensils, ShoppingCart, User, Menu, Sun, Moon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface LayoutProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
}

export default function Layout({ children, isDarkMode, setIsDarkMode }: LayoutProps) {
  const user = auth.currentUser;

  const Navigation = () => (
    <nav className="space-y-1 mt-8">
      <NavItem 
        to="/"
        icon={<Calendar className="w-5 h-5" />} 
        label="Calendario" 
      />
      <NavItem 
        to="/recipes"
        icon={<Utensils className="w-5 h-5" />} 
        label="Recetas" 
      />
      <NavItem 
        to="/shopping"
        icon={<ShoppingCart className="w-5 h-5" />} 
        label="Lista de Compra" 
      />
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-rose-100 dark:selection:bg-rose-900 selection:text-rose-900 dark:selection:text-rose-100 transition-colors duration-300">
      <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger render={<Button variant="ghost" size="icon" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl" />} >
                  <Menu className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 p-0">
                  <div className="p-8">
                    <SheetHeader className="text-left pb-6 border-b border-slate-50 dark:border-slate-800">
                      <SheetTitle className="flex items-center gap-3 text-rose-500">
                        <div className="bg-rose-500 p-2.5 rounded-2xl shadow-lg shadow-rose-200 dark:shadow-none">
                          <Calendar className="text-white w-6 h-6" />
                        </div>
                        <span className="font-black text-2xl tracking-tight">Planner</span>
                      </SheetTitle>
                    </SheetHeader>
                    <Navigation />
                  </div>
                </SheetContent>
              </Sheet>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3">
                Weekly Planner
                <div className="bg-rose-500 p-1.5 rounded-xl shadow-sm">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
              </h1>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="rounded-xl w-10 h-10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {user && (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user.displayName}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{user.email}</p>
                  </div>
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm shrink-0" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                      <User className="w-5 h-5 text-rose-500" />
                    </div>
                  )}
                </div>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout} 
                className="cursor-pointer text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl px-3 h-10 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline font-bold">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col gap-10">
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, to }: { icon: React.ReactNode, label: string, to: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `w-full flex items-center gap-4 px-4 py-4 text-sm font-bold transition-all duration-300 cursor-pointer group relative ${
        isActive 
          ? 'text-rose-600 dark:text-rose-400' 
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div 
              layoutId="nav-active"
              className="absolute left-0 w-1 h-6 bg-rose-500 rounded-r-full"
            />
          )}
          <span className={`${isActive ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500 group-hover:text-rose-500'} transition-colors duration-300`}>
            {icon}
          </span>
          <span className="tracking-tight">{label}</span>
          
          {/* Subtle background on hover */}
          <div className={`absolute inset-0 -z-10 bg-slate-50 dark:bg-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isActive ? 'opacity-100 bg-rose-50/50 dark:bg-rose-900/10' : ''}`} />
        </>
      )}
    </NavLink>
  );
}

