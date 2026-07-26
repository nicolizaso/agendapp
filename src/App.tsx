import { useState } from 'react';
import { Layout } from './components/Layout';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { Button } from './components/Button';
import { GymPage } from './features/gym/GymPage';
import { RoutinesManager } from './features/gym/RoutinesManager';
import { Dumbbell, Menu, ClipboardList } from 'lucide-react';
import { BottomNav } from './components/BottomNav';
import { MobileMenu } from './components/MobileMenu';

type Tab = 'gym' | 'routines';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('gym');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <Layout>
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <img
                src="/logo.png"
                alt="Logo Gym Tracker"
                className="w-8 h-8 object-contain"
            />
            <h1 className="text-3xl font-heading font-bold text-neutral-100 hidden sm:block">
                Gym Tracker
            </h1>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
            <Button
                variant={activeTab === 'gym' ? 'primary' : 'ghost'}
                onClick={() => setActiveTab('gym')}
                size="sm"
                className="gap-2"
            >
                <Dumbbell className="w-4 h-4" /> Gym
            </Button>
            <Button
                variant={activeTab === 'routines' ? 'primary' : 'ghost'}
                onClick={() => setActiveTab('routines')}
                size="sm"
                className="gap-2"
            >
                <ClipboardList className="w-4 h-4" /> Rutinas
            </Button>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(true)}
        >
           <Menu className="w-6 h-6 text-neutral-300" />
        </Button>
      </header>

      <div className="pb-20 md:pb-0">
      {activeTab === 'gym' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <GymPage />
        </div>
      )}

      {activeTab === 'routines' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <RoutinesManager />
        </div>
      )}

      </div> {/* End content wrapper */}

      <ConfirmDialog />

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigate={setActiveTab}
      />
    </Layout>
  );
}

export default App;