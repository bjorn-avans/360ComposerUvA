/// <reference types="react-scripts" />

declare module 'hls.js' {
    class Hls {
        constructor(config?: Record<string, unknown>);
        loadSource(src: string): void;
        attachMedia(media: HTMLMediaElement): void;
        once(event: string, handler: (...args: unknown[]) => void): void;
        on(event: string, handler: (...args: unknown[]) => void): void;
        destroy(): void;
        static isSupported(): boolean;
        static readonly Events: {
            FRAG_LOADED: string;
            [key: string]: string;
        };
    }
    export default Hls;
}
