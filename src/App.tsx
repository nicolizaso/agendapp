import { useEffect, useState } from 'react';
import { isSameMinute } from 'date-fns';
import { useStore } from './lib/store';
import { useUIStore } from './hooks/useUIStore';
import { useNotifications, getNotificationMessage } from './hooks/useNotifications';
import { Layout } from './components/Layout';
import { TaskList } from './features/tasks/TaskList';
import { Button } from './components/Button';
import { FAB } from './components/FAB';
import { CreateTaskModal } from './features/tasks/CreateTaskModal';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { TodaySection } from './features/dashboard/TodaySection';
import { CalendarSection } from './features/dashboard/CalendarSection';
import { SettingsModal } from './features/settings/components/SettingsModal';
import { HabitTracker } from './features/habits/HabitTracker';
import { AnalyticsSection } from './features/analytics/AnalyticsSection';
import { GymPage } from './features/gym/GymPage';
import { RoutinesManager } from './features/gym/RoutinesManager';
import { LayoutDashboard, ListTodo, Loader2, Settings, BarChart3, Dumbbell, Menu, ClipboardList } from 'lucide-react';
import { BottomNav } from './components/BottomNav';
import { MobileMenu } from './components/MobileMenu';

type Tab = 'dashboard' | 'tasks' | 'analytics' | 'gym' | 'shop' | 'routines';

function App() {
  const { init, isLoading, tasks } = useStore();
  const { openCreateModal, openSettingsModal } = useUIStore();
  const { requestPermission, sendNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    const checkTasks = () => {
      const now = new Date();
      tasks.forEach((task) => {
        if (
          task.status === 'PENDING' &&
          !task.isAllDay &&
          task.scheduledDate
        ) {
          const taskDate = new Date(task.scheduledDate);
          if (isSameMinute(taskDate, now) && task.id) {
            sendNotification(
              task.title,
              getNotificationMessage(task.category),
              task.id
            );
          }
        }
      });
    };

    const intervalId = setInterval(checkTasks, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [tasks, sendNotification]);

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-red-500">
            <Loader2 className="w-10 h-10 animate-spin" />
        </div>
    )
  }

  return (
    <Layout>
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <img
                src="/logo.png"
                alt="Logo Pipa's Journal"
                className="w-8 h-8 object-contain"
            />
            <h1 className="text-3xl font-heading font-bold text-neutral-100">
                Pipa's Journal
            </h1>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
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
                <ListTodo className="w-4 h-4" /> Pendientes
            </Button>
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
            <Button
                variant={activeTab === 'analytics' ? 'primary' : 'ghost'}
                onClick={() => setActiveTab('analytics')}
                size="sm"
                className="gap-2"
            >
                <BarChart3 className="w-4 h-4" /> Rendimiento
            </Button>
            <div className="w-px h-6 bg-neutral-800 mx-1" />
            <Button
                variant="ghost"
                onClick={() => openSettingsModal()}
                size="sm"
                className="w-9 px-0"
            >
                <Settings className="w-4 h-4" />
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
        {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-500 grid grid-cols-1 gap-6">
                <HabitTracker />
                <TodaySection />
                <CalendarSection />
            </div>
        )}

      {activeTab === 'tasks' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
             <TaskList />
        </div>
      )}

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

      {activeTab === 'analytics' && (
        <div className="max-w-5xl mx-auto">
             <AnalyticsSection />
        </div>
      )}

      {activeTab === 'shop' && (
         <div className="flex items-center justify-center h-64 border border-dashed border-neutral-800 rounded-2xl text-neutral-500">
            Tienda próximamente
         </div>
      )}

      </div> {/* End content wrapper */}

      <FAB onClick={() => openCreateModal()} />
      <CreateTaskModal />
      <SettingsModal />
      <ConfirmDialog />

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigate={setActiveTab}
        onOpenSettings={openSettingsModal}
      />
    </Layout>
  );
}

export default App;
