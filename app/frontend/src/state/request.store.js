import { create } from 'zustand';
export const requestStore = create((set) => ({
    pending: 0,
    start: () => set((state) => ({
        pending: state.pending + 1
    })),
    stop: () => set((state) => ({
        pending: state.pending > 0 ? state.pending - 1 : 0
    }))
}));
