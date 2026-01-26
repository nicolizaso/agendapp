import { useEffect, useState } from 'react';
import { useStore } from './lib/store';
import { Layout } from './components/Layout';
import { StatsCard } from './features/dashboard/StatsCard';
import { TaskList } from './features/tasks/TaskList';
import { RewardList } from './features/shop/RewardList';
import { CreateReward } from './features/shop/CreateReward';
import { Button } from './components/Button';
import { FAB } from './components/FAB';
import { CreateTaskModal } from './features/tasks/CreateTaskModal';
import { TodaySection } from './features/dashboard/TodaySection';
import { CalendarSection } from './features/dashboard/CalendarSection';
import { LayoutDashboard, ListTodo, ShoppingBag, Loader2 } from 'lucide-react';

type Tab = 'dashboard' | 'tasks' | 'shop';

function App() {
  const { init, isLoading } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-rose-950 text-rose-500">
            <Loader2 className="w-10 h-10 animate-spin" />
        </div>
    )
  }

  return (
    <Layout>
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-stone-100">
                La Vida de Pipa
            </h1>
            <p className="text-rose-300">Gamifica tu existencia.</p>
        </div>

        <nav className="flex items-center gap-2 bg-rose-900 p-1 rounded-lg border border-rose-800">
            <Button
                variant={activeTab === 'dashboard' ? 'primary' : 'ghost'}
                onClick={() => setActiveTab('dashboard')}
                size="sm"
                className="gap-2"
            >
                <LayoutDashboard className="w-4 h-4" /> Mi Progreso
            </Button>
            <Button
                variant={activeTab === 'tasks' ? 'primary' : 'ghost'}
                onClick={() => setActiveTab('tasks')}
                size="sm"
                className="gap-2"
            >
                <ListTodo className="w-4 h-4" /> Misiones
            </Button>
            <Button
                variant={activeTab === 'shop' ? 'primary' : 'ghost'}
                onClick={() => setActiveTab('shop')}
                size="sm"
                className="gap-2"
            >
                <ShoppingBag className="w-4 h-4" /> Mercado
            </Button>
        </nav>
      </header>

      {activeTab === 'dashboard' && (
        <div className="animate-in fade-in duration-500">
            <StatsCard />
            <TodaySection />
            <CalendarSection />
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
             <TaskList />
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <StatsCard />
             <CreateReward />
             <RewardList />
        </div>
      )}

      <FAB onClick={() => setIsModalOpen(true)} />
      <CreateTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </Layout>
  );
}

export default App;
