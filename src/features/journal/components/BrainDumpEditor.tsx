import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { db } from '../../../lib/db';
import { cn } from '../../../lib/utils';

interface BrainDumpEditorProps {
  date: Date;
  className?: string;
}

export function BrainDumpEditor({ date, className }: BrainDumpEditorProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const dateKey = format(date, 'yyyy-MM-dd');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadNote = async () => {
      try {
        const note = await db.dailyNotes.get(dateKey);
        if (mounted) {
          setContent(note?.content || '');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to load daily note:', error);
        if (mounted) setIsLoading(false);
      }
    };

    setIsLoading(true);
    loadNote();

    return () => {
      mounted = false;
    };
  }, [dateKey]);

  const saveContent = async (newContent: string) => {
    try {
      if (!newContent.trim()) {
        await db.dailyNotes.delete(dateKey);
      } else {
        await db.dailyNotes.put({ date: dateKey, content: newContent });
      }
    } catch (error) {
      console.error('Failed to save daily note:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveContent(newContent);
    }, 1000);
  };

  const handleBlur = () => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
    saveContent(content);
  };

  if (isLoading) {
    return <div className="p-4 text-neutral-500 text-sm">Cargando...</div>;
  }

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      <textarea
        value={content}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="¿Qué tienes en mente hoy? Vacía tu cerebro aquí..."
        className="w-full h-full bg-transparent resize-none focus:outline-none text-neutral-300 placeholder:text-neutral-700 p-4 font-body text-base leading-relaxed"
        spellCheck={false}
      />
    </div>
  );
}
