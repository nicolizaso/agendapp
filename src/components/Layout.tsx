import { type ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-rose-950 text-stone-200 font-sans selection:bg-rose-700/30">
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
