import { db } from '../../../lib/db';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const exportData = async () => {
  try {
    const tasks = await db.tasks.toArray();
    const backupData = {
      version: 1,
      date: new Date().toISOString(),
      tasks,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipa-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Copia de seguridad descargada correctamente');
  } catch (error) {
    console.error('Error exporting data:', error);
    toast.error('Error al exportar los datos');
  }
};

export const importData = async (file: File) => {
  try {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Basic validation
        if (!data.tasks || !Array.isArray(data.tasks)) {
          throw new Error('Formato de archivo inválido');
        }

        await db.transaction('rw', db.tasks, async () => {
          await db.tasks.clear();
          await db.tasks.bulkAdd(data.tasks);
        });

        toast.success('Datos restaurados con éxito');

        // Reload to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('Error processing backup file:', error);
        toast.error('El archivo de respaldo es inválido');
      }
    };

    reader.readAsText(file);
  } catch (error) {
    console.error('Error reading file:', error);
    toast.error('Error al leer el archivo');
  }
};
