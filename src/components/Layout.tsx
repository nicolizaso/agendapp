import { type ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-dvh bg-ink-950 text-ink-200 selection:bg-ember-500/30 selection:text-ink-100">
      <main className="container mx-auto max-w-5xl px-4 pt-safe pb-8">{children}</main>
    </div>
  );
}
