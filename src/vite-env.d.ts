/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="chromecast-caf-sender" />

declare global {
  const cast: {
    framework: {
      CastReceiverContext: {
        getInstance(): any;
      };
      CastContext: {
        getInstance(): any;
      };
      CastContextEventType: any;
      SessionState: any;
    };
  };
  const chrome: any;
}
