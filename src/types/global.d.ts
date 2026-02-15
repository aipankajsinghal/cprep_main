declare interface CpGaContext {
  post_slug?: string;
}

declare global {
  interface Window {
    __cpGaContext?: CpGaContext;
    cpTrack?: (...args: any[]) => void;
    PagefindUI?: any;
  }
}

export {};
