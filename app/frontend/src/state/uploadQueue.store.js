import { create } from 'zustand';
const STORAGE_KEY = 'caseflow-upload-queue';
const isBrowser = typeof window !== 'undefined';
const readQueueFromStorage = () => {
    if (!isBrowser)
        return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed;
        }
    }
    catch {
        // ignore corrupt storage
    }
    return [];
};
const persistQueue = (queue) => {
    if (!isBrowser)
        return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    }
    catch {
        // storage may be unavailable (Safari private mode, etc.)
    }
};
export const uploadQueueStore = create((set, get) => {
    const setQueue = (next) => {
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
                    const parsed = JSON.parse(event.newValue);
                    if (Array.isArray(parsed)) {
                        set({ queuedChunks: parsed });
                    }
                }
                catch {
                    // ignore parse errors from other tabs
                }
            }
        });
    }
    return {
        queuedChunks: readQueueFromStorage(),
        enqueue(chunk) {
            set((state) => {
                const exists = state.queuedChunks.some((queued) => queued.importId === chunk.importId && queued.payload.chunkIndex === chunk.payload.chunkIndex);
                const next = exists
                    ? state.queuedChunks.map((queued) => queued.importId === chunk.importId && queued.payload.chunkIndex === chunk.payload.chunkIndex
                        ? chunk
                        : queued)
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
