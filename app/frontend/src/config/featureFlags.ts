const flagEnabled = (value: string | undefined, fallback: boolean) => {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return fallback;
};

export const featureFlags = {
  advancedGridToolbar: flagEnabled(import.meta.env.VITE_ENABLE_ADVANCED_GRID_TOOLBAR, true),
  offlineUploadQueue: flagEnabled(import.meta.env.VITE_ENABLE_OFFLINE_UPLOAD_QUEUE, false)
};
