import { db } from '../../../lib/db';
import { toast } from 'sonner';

export const exportData = async () => {
  try {
    const backupData: Record<string, any> = {
      _meta: { timestamp: new Date().toISOString(), version: db.verno }
    };

    // Recorrer todas las tablas dinámicamente y extraer datos
    for (const table of db.tables) {
      backupData[table.name] = await table.toArray();
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_AgendApp_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Copia de seguridad descargada correctamente');
    return true;
  } catch (error) {
    console.error("Error al exportar universal:", error);
    toast.error('Error al exportar los datos');
    throw error;
  }
};

export const importData = async (file: File) => {
  try {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);

        // Iniciar transacción de escritura general
        await db.transaction('rw', db.tables, async () => {
          for (const table of db.tables) {
            if (parsedData[table.name] && Array.isArray(parsedData[table.name])) {
              await table.clear(); // Limpiar tabla actual
              await table.bulkAdd(parsedData[table.name]); // Inyectar backup
            }
          }
        });

        toast.success('Datos restaurados con éxito');

        // Reload to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error("Error al importar universal:", error);
        toast.error('El archivo de respaldo es inválido o hubo un error');
      }
    };

    reader.readAsText(file);
  } catch (error) {
    console.error('Error reading file:', error);
    toast.error('Error al leer el archivo');
  }
};

export const rescueEmergencyBackup = async () => {
  return new Promise((resolve, reject) => {
    // Abrimos BD nativa sin especificar versión para evitar conflictos
    const request = indexedDB.open('VectorLifeDB');

    request.onsuccess = async (event) => {
      const idb = (event.target as IDBOpenDBRequest).result;
      const objectStoreNames = Array.from(idb.objectStoreNames);
      const backupData: Record<string, any> = {
        _meta: { isEmergencyRescue: true, timestamp: new Date().toISOString() }
      };

      try {
        for (const storeName of objectStoreNames) {
          backupData[storeName] = await new Promise((res, rej) => {
            const transaction = idb.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getAll = store.getAll();
            getAll.onsuccess = () => res(getAll.result);
            getAll.onerror = () => rej(getAll.error);
          });
        }

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RESCATE_EMERGENCIA_AgendApp_${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        resolve(true);
      } catch (error) {
        reject(error);
      } finally {
        idb.close();
      }
    };

    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
};
