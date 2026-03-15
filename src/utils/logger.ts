const IS_PROD = import.meta.env.PROD;
const DEBUG_ENABLED = import.meta.env.VITE_DEBUG_LOGGING === 'true';

export const logger = {
  log: (message: string, ...args: unknown[]) => {
    if (!IS_PROD || DEBUG_ENABLED) {
      console.log(`🎬 [DEV]: ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (!IS_PROD || DEBUG_ENABLED) {
      console.warn(`🎬 [WARN]: ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    // We always log errors to the console, even in prod
    console.error(`🚨 [ERROR]: ${message}`, ...args);
    
    // Persist to session storage for post-mortem debugging on headless/TV devices
    try {
      const errorStr = `${message} ${args.map(a => JSON.stringify(a)).join(' ')}`;
      sessionStorage.setItem('fmn_last_error', errorStr);
    } catch {
      // Ignore storage errors
    }
  }
};
