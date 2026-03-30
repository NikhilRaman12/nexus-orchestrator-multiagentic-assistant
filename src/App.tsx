import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signInWithPopup, googleProvider, signOut, User } from './firebase';
import Chat from './components/Chat';
import Dashboard from './components/Dashboard';
import { Bot, LayoutDashboard, MessageSquare, LogOut, Shield, Zap, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Initializing Nexus...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-12 text-center"
        >
          <div className="space-y-4">
            <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)]">
              <Bot className="w-10 h-10 text-black" />
            </div>
            <div className="space-y-2">
              <h1 className="text-5xl font-black tracking-tighter uppercase italic">Nexus</h1>
              <p className="text-gray-400 text-sm font-medium tracking-wide">Multi-Agent AI Orchestrator</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <FeatureItem icon={<Shield className="w-4 h-4" />} title="Secure" desc="Encrypted persistence" />
            <FeatureItem icon={<Zap className="w-4 h-4" />} title="Fast" desc="Real-time sub-agents" />
            <FeatureItem icon={<Terminal className="w-4 h-4" />} title="Smart" desc="Intent decomposition" />
            <FeatureItem icon={<LayoutDashboard className="w-4 h-4" />} title="Unified" desc="Single API interface" />
          </div>

          <button
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="w-full py-4 bg-white text-black rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 shadow-xl"
          >
            Authenticate with Google
          </button>
          
          <p className="text-[10px] text-gray-600 uppercase font-bold tracking-[0.2em]">
            System Version 1.0.42-Stable
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#F8F9FB] flex overflow-hidden font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-right border-gray-100 flex flex-col transition-all">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="hidden lg:block font-black text-xl tracking-tighter uppercase italic">Nexus</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
          />
          <NavItem 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')}
            icon={<MessageSquare className="w-5 h-5" />}
            label="Orchestrator"
          />
        </nav>

        <div className="p-4 border-top border-gray-100">
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
            <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-lg flex-shrink-0" referrerPolicy="no-referrer" />
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{user.displayName}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="p-2 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-bottom border-gray-100 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current View</span>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">
              {activeTab === 'dashboard' ? 'Overview' : 'Agent Console'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Sync Active</span>
            </div>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute inset-0"
              >
                <Dashboard />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute inset-0 p-6"
              >
                <Chat />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-2xl transition-all group",
        active ? "bg-black text-white shadow-lg shadow-black/10" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <div className={cn("flex-shrink-0", active ? "text-white" : "group-hover:text-gray-900")}>
        {icon}
      </div>
      <span className="hidden lg:block text-sm font-bold tracking-tight">{label}</span>
    </button>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
      <div className="text-white mb-2">{icon}</div>
      <p className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">{title}</p>
      <p className="text-[10px] text-gray-500 font-medium leading-tight">{desc}</p>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
