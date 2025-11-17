import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uploadQueueStore } from './uploadQueue.store';
import type { QueuedChunk } from './uploadQueue.store';
import type { CaseRowInput } from '../api/types';

const baseChunk: QueuedChunk = {
  importId: 'import-1',
  payload: {
    chunkIndex: 0,
    rows: []
  }
};

describe('uploadQueueStore', () => {
  beforeEach(() => {
    uploadQueueStore.getState().clear();
    window.localStorage.clear();
  });

  it('persists queue changes to localStorage', () => {
    const proto = Object.getPrototypeOf(window.localStorage);
    const spy = vi.spyOn(proto, 'setItem');
    uploadQueueStore.getState().enqueue(baseChunk);
    expect(uploadQueueStore.getState().queuedChunks).toHaveLength(1);
    expect(spy).toHaveBeenCalledWith('caseflow-upload-queue', expect.any(String));
    spy.mockRestore();
  });

  it('dedupes chunks by importId and chunkIndex', () => {
    uploadQueueStore.getState().enqueue(baseChunk);
    uploadQueueStore.getState().enqueue({
      ...baseChunk,
      payload: { ...baseChunk.payload, rows: [{ rowNumber: 1, data: {} as CaseRowInput, raw: {} }] }
    });
    expect(uploadQueueStore.getState().queuedChunks).toHaveLength(1);
  });

  it('drains and clears queue', () => {
    uploadQueueStore.getState().enqueue(baseChunk);
    const drained = uploadQueueStore.getState().drain();
    expect(drained).toHaveLength(1);
    expect(uploadQueueStore.getState().queuedChunks).toHaveLength(0);
  });
});
