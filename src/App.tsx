import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { BottomNav, NAV_ITEMS } from './components/BottomNav';
import { Button } from './components/Button';
import { Logo } from './components/Logo';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { GymPage } from './features/gym/GymPage';
import { RoutinesManager } from './features/gym/RoutinesManager';
import { ExerciseLibrary } from './features/gym/components/ExerciseLibrary';
import { AgendaPage } from './features/agenda/AgendaPage';
import { DataPage } from './features/data/DataPage';
import { WorkoutSession } from './features/gym/session/WorkoutSession';
import { WorkoutSummarySheet } from './features/gym/session/WorkoutSummarySheet';
import { useGymStore } from './hooks/useGymStore';
import { cn } from './lib/utils';

type Tab = (typeof NAV_ITEMS)[number]['id'];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('gym');

  const init = useGymStore((state) => state.init);
  const isWorkoutActive = useGymStore((state) => state.isWorkoutActive);
  const lastSummary = useGymStore((state) => state.lastSummary);
  const clearLastSummary = useGymStore((state) => state.clearLastSummary);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Layout>
      {/* Cabecera de escritorio: en mobile la navegación vive abajo */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <Logo size="sm" className="md:hidden" />
        <div className="hidden md:block">
          <Logo showTagline />
        </div>

        <nav className="hidden items-center gap-1 rounded-2xl border border-ink-800 bg-ink-900 p-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(item.id)}
                className={cn(!isActive && 'text-ink-400')}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </header>

      <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'gym' && <GymPage />}
        {activeTab === 'agenda' && <AgendaPage />}
        {activeTab === 'routines' && <RoutinesManager />}
        {activeTab === 'exercises' && <ExerciseLibrary />}
        {activeTab === 'data' && <DataPage />}
      </div>

      <ConfirmDialog />
      <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} />

      {isWorkoutActive && <WorkoutSession />}
      <WorkoutSummarySheet summary={lastSummary} onClose={clearLastSummary} />
    </Layout>
  );
}
