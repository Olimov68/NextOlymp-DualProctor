
let faceLandmarkerInstance: any = null;
let loadingPromise: Promise<any> | null = null;

export async function getMediaPipeFaceLandmarker(): Promise<any> {
  if (faceLandmarkerInstance) {
    return faceLandmarkerInstance;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      
      const { FaceLandmarker, FilesetResolver } = await import(
        
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest'
      );

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      try {
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 3,
          minFaceDetectionConfidence: 0.55,
          minFacePresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });
      } catch (gpuError) {
        console.warn('FaceLandmarker GPU init failed, falling back to CPU:', gpuError);
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 3,
          minFaceDetectionConfidence: 0.55,
          minFacePresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });
      }

      return faceLandmarkerInstance;
    } catch (err) {
      console.error('Failed to load MediaPipe FaceLandmarker:', err);
      loadingPromise = null;
      return null;
    }
  })();

  return loadingPromise;
}
