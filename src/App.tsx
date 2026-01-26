import { useEffect, useState } from 'react';
import { useStore } from './lib/store';
import { Layout } from './components/Layout';
import { StatsCard } from './features/dashboard/StatsCard';
import { TaskCreator } from './features/tasks/TaskCreator';
import { TaskList } from './features/tasks/TaskList';
import { RewardList } from './features/shop/RewardList';
import { CreateReward } from './features/shop/CreateReward';
import { Button } from './components/Button';
import { LayoutDashboard, ListTodo, ShoppingBag, Loader2 } from 'lucide-react';

type Tab = 'dashboard' | 'tasks' | 'shop';

function App() {
  const { init, isLoading } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  useEffect(() => {
    init();
  }, [init]);

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-gold-500">
            <Loader2 className="w-10 h-10 animate-spin" />
        </div>
    )
  }

  return (
    <Layout>
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-400 to-amber-600 bg-clip-text text-transparent">
                VectorLife
            </h1>
            <p className="text-slate-400">Gamify your existence.</p>
        </div>

        <nav className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <Button
                variant={activeTab === 'dashboard' ? 'primary' : 'ghost'}
                onClick={() => setActiveTab('dashboard')}
                size="sm"
                className="gap-2"
            >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Button>
            <Button
                variant={activeTab === 'tasks' ? 'primary' : 'ghost'}
                onClick={() => setActiveTab('tasks')}
                size="sm"
                className="gap-2"
            >
                <ListTodo className="w-4 h-4" /> Missions
            </Button>
            <Button
                variant={activeTab === 'shop' ? 'primary' : 'ghost'}
                onClick={() => setActiveTab('shop')}
                size="sm"
                className="gap-2"
            >
                <ShoppingBag className="w-4 h-4" /> Shop
            </Button>
        </nav>
      </header>

      {activeTab === 'dashboard' && (
        <div className="animate-in fade-in duration-500">
            <StatsCard />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-bold text-slate-200 mb-4">Active Missions</h2>
                    <TaskList />
                </div>
                 <div>
                    <h2 className="text-xl font-bold text-slate-200 mb-4">Quick Shop</h2>
                    <RewardList />
                </div>
            </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
             <TaskCreator />
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
    </Layout>
  );
}

export default App;
