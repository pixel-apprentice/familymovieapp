const IS_PROD = import.meta.env.PROD;
const DEBUG_ENABLED = import.meta.env.VITE_DEBUG_LOGGING === 'true';

export interface ErrorLog {
  message: string;
  timestamp: string;
  stack?: string;
  args?: string;
}

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
    
    // Persist to session storage for post-mortem debugging
    try {
      if (typeof sessionStorage === 'undefined') return;
      const logsRaw = sessionStorage.getItem('fmn_error_logs');
      let logs: ErrorLog[] = [];
      try {
        logs = logsRaw ? JSON.parse(logsRaw) : [];
        if (!Array.isArray(logs)) logs = [];
      } catch {
        logs = [];
      }
      
      const newLog: ErrorLog = {
        message,
        timestamp: new Date().toISOString(),
        args: args.length > 0 ? args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') : undefined
      };

      // Try to extract stack from any Error objects in args
      const errorArg = args.find(a => a instanceof Error) as Error | undefined;
      if (errorArg?.stack) {
        newLog.stack = errorArg.stack;
      }

      logs.unshift(newLog);
      logs = logs.slice(0, 10); // Keep last 10
      
      sessionStorage.setItem('fmn_error_logs', JSON.stringify(logs));
      
      // Cleanup legacy key if it exists
      sessionStorage.removeItem('fmn_last_error');
    } catch {
      // Ignore storage errors
    }
  }
};
