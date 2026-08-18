# Carga

**Carga** es una app de registro de entrenamiento en el gimnasio: armás tus rutinas,
las ejecutás serie por serie y mirás tu progreso. Funciona 100% offline —todo se
guarda en el dispositivo (IndexedDB)— y se puede instalar como PWA.

El nombre viene del peso que levantás y de lo que hace la app: cargar cada serie.

## Qué hace

- **Modo entrenamiento**: un ejercicio por vez, con las series editables en línea,
  el peso y las reps de la sesión anterior a la vista, cronómetro de descanso,
  cambio de ejercicio si la máquina está ocupada y recuperación automática de la
  sesión si se cierra el navegador.
- **Rutinas**: planes reutilizables con series, repeticiones y peso base por
  ejercicio.
- **Biblioteca**: catálogo remoto de ejercicios (con imágenes) más los propios,
  con notas de puesta a punto de cada máquina.
- **Historial**: calendario de asistencia, resumen de cada sesión y 1RM estimado.

## Stack

React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · Zustand · Dexie (IndexedDB) · Sonner

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # typecheck + build de producción
npm run lint     # ESLint
```

## Estructura

```
src/
  components/            primitivos de UI (Button, Card, Modal, Logo...)
  features/gym/
    components/          dashboard, rutinas, biblioteca, formularios
    session/             modo entrenamiento (WorkoutSession y sus piezas)
    taxonomy.ts          grupos musculares y equipamiento
  hooks/useGymStore.ts   estado del entrenamiento y acceso a la base
  lib/db.ts              esquema de IndexedDB
  lib/exerciseApi.ts     catálogo remoto de ejercicios
```

## Datos

La base local se llama `VectorLifeDB` por razones históricas y conserva tablas de
una agenda anterior que la app ya no usa; se mantienen declaradas para no borrar
datos de instalaciones viejas.

El catálogo de ejercicios se descarga una sola vez desde
[free-exercise-db](https://github.com/yuhonas/free-exercise-db) (con varios CDN de
respaldo) y queda cacheado. Si la descarga falla, la app lo avisa y ofrece
reintentar o crear ejercicios propios.
