
declare module 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest' {
  export class FaceLandmarker {
    static createFromOptions(vision: any, options: any): Promise<FaceLandmarker>;
    detectForVideo(video: HTMLVideoElement, timestamp: number): {
      faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
    };
    close(): void;
  }

  export class FilesetResolver {
    static forVisionTasks(wasmPath: string): Promise<any>;
  }
}
