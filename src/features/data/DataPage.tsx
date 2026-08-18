import { useState } from 'react';
import { Database } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ExportView } from './components/ExportView';
import { ImportView } from './components/ImportView';

type SubTab = 'export' | 'import';

export function DataPage() {
  const [subTab, setSubTab] = useState<SubTab>('export');

  return (
    <div className="space-y-6 pb-24">
      <header>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold tracking-tight text-ink-100 sm:text-3xl">
          <Database className="h-6 w-6 text-ember-400" />
          Datos
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          Armá un JSON con lo que quieras exportar, o importá uno de otro dispositivo.
        </p>
      </header>

      <div className="flex w-fit items-center gap-1 rounded-2xl border border-ink-800 bg-ink-900 p-1">
        <SubTabButton active={subTab === 'export'} onClick={() => setSubTab('export')}>
          Exportar
        </SubTabButton>
        <SubTabButton active={subTab === 'import'} onClick={() => setSubTab('import')}>
          Importar
        </SubTabButton>
      </div>

      {subTab === 'export' ? <ExportView /> : <ImportView />}
    </div>
  );
}

function SubTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-10 rounded-xl px-4 text-sm font-semibold transition-colors',
        active ? 'bg-ember-500 text-ink-950' : 'text-ink-400 hover:text-ink-100'
      )}
    >
      {children}
    </button>
  );
}
