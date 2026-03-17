declare namespace cast {
  namespace framework {
    enum CastContextEventType {
      CAST_STATE_CHANGED = 'caststatechanged',
      SESSION_STATE_CHANGED = 'sessionstatechanged',
      CAST_ERROR = 'casterror'
    }

    enum SessionState {
      NO_SESSION = 'NO_SESSION',
      SESSION_STARTING = 'SESSION_STARTING',
      SESSION_STARTED = 'SESSION_STARTED',
      SESSION_START_FAILED = 'SESSION_START_FAILED',
      SESSION_ENDING = 'SESSION_ENDING',
      SESSION_ENDED = 'SESSION_ENDED',
      SESSION_RESUMING = 'SESSION_RESUMING',
      SESSION_RESUMED = 'SESSION_RESUMED'
    }

    interface CastContext {
      setOptions(options: CastOptions): void;
      addEventListener(type: CastContextEventType, handler: (event: any) => void): void;
      removeEventListener(type: CastContextEventType, handler: (event: any) => void): void;
      getCurrentSession(): CastSession | null;
      getSessionState(): SessionState;
      requestSession(options?: CastOptions): Promise<void>;
      endCurrentSession(stopCasting: boolean): Promise<void>;
      static getInstance(): CastContext;
    }

    interface CastOptions {
      receiverApplicationId: string;
      autoJoinPolicy?: string;
      androidReceiverCompatible?: boolean;
    }

    interface CastSession {
      getCastDevice(): any;
      getMediaSession(): any;
      loadMedia(loadRequest: any): Promise<void>;
    }
  }
}

declare namespace chrome {
  namespace cast {
    enum AutoJoinPolicy {
      TAB_AND_ORIGIN_SCOPED = 'TAB_AND_ORIGIN_SCOPED',
      ORIGIN_SCOPED = 'ORIGIN_SCOPED',
      PAGE_SCOPED = 'PAGE_SCOPED'
    }

    interface lastError {
      code: string;
      description: string;
    }

    let isAvailable: boolean;
  }
}

interface Window {
  __onGCastApiAvailable: (isAvailable: boolean) => void;
  cast: typeof cast;
  chrome: typeof chrome;
}
