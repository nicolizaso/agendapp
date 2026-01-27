import { useEffect, useState } from 'react';
import { isSameMinute } from 'date-fns';
import { useStore } from './lib/store';
import { useNotifications, getNotificationMessage } from './hooks/useNotifications';
import { Layout } from './components/Layout';
import { TaskList } from './features/tasks/TaskList';
import { Button } from './components/Button';
import { FAB } from './components/FAB';
import { CreateTaskModal } from './features/tasks/CreateTaskModal';
import { TodaySection } from './features/dashboard/TodaySection';
import { CalendarSection } from './features/dashboard/CalendarSection';
import { LayoutDashboard, ListTodo, Loader2 } from 'lucide-react';

type Tab = 'dashboard' | 'tasks';

function App() {
  const { init, isLoading, tasks } = useStore();
  const { requestPermission, sendNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <div className="min-h-screen flex items-center justify-center bg-rose-950 text-rose-500">
            <Loader2 className="w-10 h-10 animate-spin" />
        </div>
    )
  }

  return (
    <Layout>
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <img
                src="/logo.png"
                alt="Logo Pipa's Journal"
                className="w-8 h-8 object-contain"
            />
            <h1 className="text-3xl font-heading font-bold text-stone-100">
                Pipa's Journal
            </h1>
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
                <ListTodo className="w-4 h-4" /> Pendientes
            </Button>
        </nav>
      </header>

      {activeTab === 'dashboard' && (
        <div className="animate-in fade-in duration-500 grid grid-cols-1 gap-6">
            <TodaySection />
            <CalendarSection />
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
             <TaskList />
        </div>
      )}

      <FAB onClick={() => setIsModalOpen(true)} />
      <CreateTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </Layout>
  );
}

export default App;
