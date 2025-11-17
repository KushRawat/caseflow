import { create } from 'zustand';

type RequestState = {
  pending: number;
  start: () => void;
  stop: () => void;
};

export const requestStore = create<RequestState>((set) => ({
  pending: 0,
  start: () =>
    set((state) => ({
      pending: state.pending + 1
    })),
  stop: () =>
    set((state) => ({
      pending: state.pending > 0 ? state.pending - 1 : 0
    }))
}));
