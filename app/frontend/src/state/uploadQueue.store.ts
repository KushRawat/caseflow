import { create } from 'zustand';

import type { ChunkPayload } from '../api/imports';

export type QueuedChunk = {
  importId: string;
  payload: ChunkPayload;
};

type UploadQueueState = {
  queuedChunks: QueuedChunk[];
  enqueue: (chunk: QueuedChunk) => void;
  requeue: (chunk: QueuedChunk) => void;
  drain: () => QueuedChunk[];
  clear: () => void;
};

const STORAGE_KEY = 'caseflow-upload-queue';
const isBrowser = typeof window !== 'undefined';

const readQueueFromStorage = (): QueuedChunk[] => {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedChunk[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return [];
};

const persistQueue = (queue: QueuedChunk[]) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // storage may be unavailable (Safari private mode, etc.)
  }
};

export const uploadQueueStore = create<UploadQueueState>((set, get) => {
  const setQueue = (next: QueuedChunk[]) => {
    persistQueue(next);
    set({ queuedChunks: next });
  };

  if (isBrowser) {
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) {
        if (!event.newValue) {
          set({ queuedChunks: [] });
          return;
        }
        try {
          const parsed = JSON.parse(event.newValue) as QueuedChunk[];
          if (Array.isArray(parsed)) {
            set({ queuedChunks: parsed });
          }
        } catch {
          // ignore parse errors from other tabs
        }
      }
    });
  }

  return {
    queuedChunks: readQueueFromStorage(),
    enqueue(chunk) {
      set((state) => {
        const exists = state.queuedChunks.some(
          (queued) =>
            queued.importId === chunk.importId && queued.payload.chunkIndex === chunk.payload.chunkIndex
        );
        const next = exists
          ? state.queuedChunks.map((queued) =>
              queued.importId === chunk.importId && queued.payload.chunkIndex === chunk.payload.chunkIndex
                ? chunk
                : queued
            )
          : [...state.queuedChunks, chunk];
        persistQueue(next);
        return { queuedChunks: next };
      });
    },
    requeue(chunk) {
      get().enqueue(chunk);
    },
    drain() {
      const items = get().queuedChunks;
      setQueue([]);
      return items;
    },
    clear() {
      setQueue([]);
    }
  };
});
