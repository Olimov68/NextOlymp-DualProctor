

export interface VoiceprintData {
  userId: string;
  userName: string;
  enrolledAt: string;
  featureVector: number[]; 
  sampleRate: number;
}

export interface AudioAnalysisResult {
  hasSpeech: boolean;
  isViolation: boolean;
  violationType?: 'UNKNOWN_SPEAKER_VOICE' | 'MULTIPLE_SPEAKERS_DETECTED' | 'PROHIBITED_KEYWORD';
  similarity: number; 
  confidence: number;
  reason?: string;
  audioLevel: number;
}

const STORAGE_VOICEPRINT_PREFIX = 'next_olymp_voiceprint_';

export function extractAcousticEmbedding(audioBuffer: AudioBuffer): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const fftSize = 1024;
  const hopSize = 512;
  const numFrames = Math.floor((channelData.length - fftSize) / hopSize);

  if (numFrames <= 0) {
    return new Array(64).fill(0);
  }

  
  const bands = 64;
  const vector = new Float32Array(bands);
  let activeFrames = 0;

  for (let f = 0; f < numFrames; f++) {
    const start = f * hopSize;
    let frameEnergy = 0;

    
    for (let i = 0; i < fftSize; i++) {
      const sample = channelData[start + i];
      frameEnergy += sample * sample;
    }
    const rms = Math.sqrt(frameEnergy / fftSize);

    
    if (rms < 0.015) continue;
    activeFrames++;

    
    const bandSize = Math.floor(fftSize / (bands * 2));
    for (let b = 0; b < bands; b++) {
      let bandSum = 0;
      const bStart = start + b * bandSize;
      for (let i = 0; i < bandSize; i++) {
        const s = channelData[bStart + i] || 0;
        bandSum += Math.abs(s);
      }
      vector[b] += bandSum / bandSize;
    }
  }

  if (activeFrames > 0) {
    for (let b = 0; b < bands; b++) {
      vector[b] /= activeFrames;
    }
  }

  
  let norm = 0;
  for (let b = 0; b < bands; b++) norm += vector[b] * vector[b];
  norm = Math.sqrt(norm) || 1e-6;

  return Array.from(vector).map((v) => v / norm);
}

export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  const sim = dotProduct / denominator;
  return Math.max(0, Math.min(1, sim));
}

export const audioProctoringService = {
  
  saveVoiceprint(
    userId: string,
    userName: string,
    featureVector: number[],
    sampleRate = 16000,
    contestId?: string
  ): VoiceprintData {
    const data: VoiceprintData = {
      userId,
      userName,
      enrolledAt: new Date().toISOString(),
      featureVector,
      sampleRate
    };
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(`${STORAGE_VOICEPRINT_PREFIX}${userId}`, json);
      localStorage.setItem(`voiceprint_${userId}`, json);
      localStorage.setItem(`next_olymp_latest_voiceprint`, json);

      if (contestId) {
        localStorage.setItem(`voiceprint_${contestId}`, json);
        localStorage.setItem(`${STORAGE_VOICEPRINT_PREFIX}${contestId}`, json);
        localStorage.setItem(`voiceprint_${userId}_${contestId}`, json);
      }

      console.log('[AudioProctoring AI] ✓ Voiceprint saved to storage:', {
        userId,
        contestId,
        embeddingDims: featureVector.length,
        sampleRate
      });
    } catch (e) {
      console.warn('[AudioProctoring AI] ⚠ Error saving voiceprint to localStorage:', e);
    }
    return data;
  },

  
  getVoiceprint(userId?: string, contestId?: string): VoiceprintData | null {
    const candidateKeys = [
      contestId ? `voiceprint_${contestId}` : null,
      contestId ? `${STORAGE_VOICEPRINT_PREFIX}${contestId}` : null,
      userId && contestId ? `voiceprint_${userId}_${contestId}` : null,
      userId ? `${STORAGE_VOICEPRINT_PREFIX}${userId}` : null,
      userId ? `voiceprint_${userId}` : null,
      'next_olymp_latest_voiceprint'
    ].filter(Boolean) as string[];

    for (const key of candidateKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.featureVector) && parsed.featureVector.length > 0) {
            console.log(`[AudioProctoring AI] Found valid voiceprint in key: "${key}"`);
            return parsed;
          }
        }
      } catch {}
    }

    console.warn('[AudioProctoring AI] No voiceprint found for user/contest:', { userId, contestId });
    return null;
  },

  
  hasEnrolledVoice(userId?: string, contestId?: string): boolean {
    return Boolean(this.getVoiceprint(userId, contestId));
  },

  
  analyzeLiveAudio(
    audioBuffer: AudioBuffer,
    enrolledVoiceprint: VoiceprintData | null,
    options: {
      similarityThreshold?: number;
      detectUnknownSpeakers?: boolean;
      detectMultipleSpeakers?: boolean;
    } = {}
  ): AudioAnalysisResult {
    const channelData = audioBuffer.getChannelData(0);
    const threshold = options.similarityThreshold ?? 0.70;

    
    let sumSquares = 0;
    for (let i = 0; i < channelData.length; i++) {
      sumSquares += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(sumSquares / channelData.length);
    const audioLevel = Math.min(100, Math.round(rms * 400));

    
    if (rms < 0.02) {
      return {
        hasSpeech: false,
        isViolation: false,
        similarity: 1.0,
        confidence: 0.99,
        audioLevel
      };
    }

    
    const currentEmbedding = extractAcousticEmbedding(audioBuffer);

    
    if (!enrolledVoiceprint || !enrolledVoiceprint.featureVector) {
      return {
        hasSpeech: true,
        isViolation: false,
        similarity: 0.9,
        confidence: 0.8,
        audioLevel
      };
    }

    
    const similarity = calculateCosineSimilarity(enrolledVoiceprint.featureVector, currentEmbedding);

    
    let isMultiSpeaker = false;
    if (options.detectMultipleSpeakers !== false) {
      
      const subChunkSize = Math.floor(channelData.length / 3);
      const subSims: number[] = [];

      for (let s = 0; s < 3; s++) {
        const subData = channelData.subarray(s * subChunkSize, (s + 1) * subChunkSize);
        let subEnergy = 0;
        for (let j = 0; j < subData.length; j++) subEnergy += subData[j] * subData[j];
        if (Math.sqrt(subEnergy / subData.length) >= 0.02) {
          
          const subVec = new Float32Array(64);
          for (let b = 0; b < 64; b++) {
            subVec[b] = Math.abs(subData[b * 10] || 0);
          }
          let norm = 0;
          for (let b = 0; b < 64; b++) norm += subVec[b] * subVec[b];
          norm = Math.sqrt(norm) || 1e-6;
          const normSubVec = Array.from(subVec).map(v => v / norm);
          subSims.push(calculateCosineSimilarity(enrolledVoiceprint.featureVector, normSubVec));
        }
      }

      if (subSims.length >= 2) {
        const minSim = Math.min(...subSims);
        const maxSim = Math.max(...subSims);
        if (maxSim >= 0.70 && minSim < 0.50) {
          isMultiSpeaker = true;
        }
      }
    }

    if (isMultiSpeaker) {
      return {
        hasSpeech: true,
        isViolation: true,
        violationType: 'MULTIPLE_SPEAKERS_DETECTED',
        similarity,
        confidence: 0.91,
        reason: "Kadrda bir nechta shaxs ovozi yoki yordamchi pichirlashi aniqlandi!",
        audioLevel
      };
    }

    if (options.detectUnknownSpeakers !== false && similarity < threshold) {
      return {
        hasSpeech: true,
        isViolation: true,
        violationType: 'UNKNOWN_SPEAKER_VOICE',
        similarity,
        confidence: Number((1.0 - similarity).toFixed(2)),
        reason: `Begona shaxs ovozi aniqlandi! O'xshashlik: ${Math.round(similarity * 100)}% (talab: ${Math.round(threshold * 100)}%)`,
        audioLevel
      };
    }

    return {
      hasSpeech: true,
      isViolation: false,
      similarity,
      confidence: similarity,
      audioLevel
    };
  }
};
