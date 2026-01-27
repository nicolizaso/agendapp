import { useState, useEffect } from 'react';
import { db } from '../../../lib/db';
import { format } from 'date-fns';

interface BrainDumpEditorProps {
  date: Date;
}

export function BrainDumpEditor({ date }: BrainDumpEditorProps) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const [content, setContent] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial data
  useEffect(() => {
    setIsLoaded(false);
    db.dailyNotes.get(dateStr).then((note) => {
      setContent(note ? note.content : '');
      setIsLoaded(true);
    });
  }, [dateStr]);

  // Save with debounce
  useEffect(() => {
    if (!isLoaded) return;

    const timeoutId = setTimeout(() => {
      db.dailyNotes.put({ date: dateStr, content });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [content, dateStr, isLoaded]);

  // Save on blur to ensure data is captured if the user leaves immediately
  const handleBlur = () => {
    if (isLoaded) {
      db.dailyNotes.put({ date: dateStr, content });
    }
  };

  if (!isLoaded) {
    return <div className="w-full h-full flex items-center justify-center text-neutral-500">Cargando...</div>;
  }

  return (
    <textarea
      value={content}
      onChange={(e) => setContent(e.target.value)}
      onBlur={handleBlur}
      placeholder="¿Qué tienes en mente hoy? Vacía tu cerebro aquí..."
      className="w-full h-full min-h-[400px] bg-transparent resize-none outline-none text-neutral-300 placeholder:text-neutral-700 font-body text-base p-1 leading-relaxed border-none focus:ring-0"
      spellCheck={false}
    />
  );
}
