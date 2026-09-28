import { useState, useRef, useCallback, useEffect } from 'react';
import { audioProctoringService, VoiceprintData, AudioAnalysisResult, extractAcousticEmbedding } from '../services/audioProctoringService';
import { useAuthStore } from '../store/useAuthStore';

interface UseAudioProctoringProps {
  onViolation?: (violation: { type: string; detail: string; confidence: number }) => void;
  similarityThreshold?: number;
  detectUnknownSpeakers?: boolean;
  detectMultipleSpeakers?: boolean;
  enabled?: boolean;
  contestId?: string;
  olympiadId?: string;
}

export const useAudioProctoring = ({
  onViolation,
  similarityThreshold = 0.70,
  detectUnknownSpeakers = true,
  detectMultipleSpeakers = true,
  enabled = true,
  contestId,
  olympiadId
}: UseAudioProctoringProps = {}) => {
  const activeContestId = contestId || olympiadId;
  const currentUser = useAuthStore((state) => state.user);
  const userId = currentUser?.id || 'usr-current';
  const userName = currentUser?.fullName || 'Ishtirokchi';

  const [isEnrolled, setIsEnrolled] = useState<boolean>(() =>
    audioProctoringService.hasEnrolledVoice(userId, activeContestId)
  );
  const [isRecordingEnrollment, setIsRecordingEnrollment] = useState(false);
  const [enrollProgress, setEnrollProgress] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AudioAnalysisResult | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const intervalRef = useRef<any>(null);

  
  useEffect(() => {
    const enrolled = audioProctoringService.hasEnrolledVoice(userId, activeContestId);
    setIsEnrolled(enrolled);
    console.log('[AudioProctoring AI] Voice enrollment status:', { userId, contestId: activeContestId, isEnrolled: enrolled });
  }, [userId, activeContestId]);

  
  const startEnrollment = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[AudioProctoring AI] Starting voice enrollment...', { userId, contestId: activeContestId });
      setIsRecordingEnrollment(true);
      setEnrollProgress(0);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true
        }
      });

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      const startTime = Date.now();
      const DURATION_MS = 4000;

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, Math.round((elapsed / DURATION_MS) * 100));
        setEnrollProgress(pct);
      }, 50);

      return new Promise<boolean>((resolve) => {
        mediaRecorder.onstop = async () => {
          clearInterval(progressInterval);
          stream.getTracks().forEach((t) => t.stop());
          audioCtx.close().catch(() => {});

          try {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const arrayBuffer = await audioBlob.arrayBuffer();
            const decodeCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (decodeCtx.state === 'suspended') {
              await decodeCtx.resume();
            }
            const decodedBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
            decodeCtx.close().catch(() => {});

            const featureVector = extractAcousticEmbedding(decodedBuffer);
            audioProctoringService.saveVoiceprint(
              userId,
              userName,
              featureVector,
              decodedBuffer.sampleRate,
              activeContestId
            );

            setIsEnrolled(true);
            setIsRecordingEnrollment(false);
            setEnrollProgress(100);
            console.log('[AudioProctoring AI] Enrollment successful! Vector dims:', featureVector.length);
            resolve(true);
          } catch (err) {
            console.error('[AudioProctoring AI] Error decoding enrollment audio:', err);
            setIsRecordingEnrollment(false);
            resolve(false);
          }
        };

        mediaRecorder.start();
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, DURATION_MS);
      });
    } catch (e) {
      console.error('[AudioProctoring AI] Microphone access denied during enrollment:', e);
      setIsRecordingEnrollment(false);
      return false;
    }
  }, [userId, userName, activeContestId]);

  
  const startMonitoring = useCallback(async () => {
    if (isMonitoring || !enabled) {
      console.log('[AudioProctoring AI] startMonitoring skipped. Already monitoring or not enabled:', { isMonitoring, enabled });
      return;
    }

    try {
      console.log('[AudioProctoring AI] Requesting microphone for live monitoring...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;
      console.log('[AudioProctoring AI] AudioContext initialized & running:', audioCtx.state);

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      
      const enrolledVoiceprint = audioProctoringService.getVoiceprint(userId, activeContestId);
      console.log('[AudioProctoring AI] Live stream bound to voiceprint:', Boolean(enrolledVoiceprint));

      const CHUNK_DURATION_MS = 2000;

      intervalRef.current = setInterval(async () => {
        if (!streamRef.current || !audioContextRef.current) return;

        
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume().catch(() => {});
        }

        try {
          const rec = new MediaRecorder(streamRef.current);
          const chunks: Blob[] = [];

          rec.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };

          rec.onstop = async () => {
            try {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              const buf = await blob.arrayBuffer();
              const decCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
              if (decCtx.state === 'suspended') {
                await decCtx.resume();
              }
              const audioBuf = await decCtx.decodeAudioData(buf);
              decCtx.close().catch(() => {});

              
              const currentVoiceprint = enrolledVoiceprint || audioProctoringService.getVoiceprint(userId, activeContestId);

              const analysis = audioProctoringService.analyzeLiveAudio(audioBuf, currentVoiceprint, {
                similarityThreshold,
                detectUnknownSpeakers,
                detectMultipleSpeakers
              });

              setLastAnalysis(analysis);

              if (analysis.hasSpeech) {
                console.log('[AudioProctoring AI] 🎙️ Speech Detected:', {
                  similarity: `${Math.round(analysis.similarity * 100)}%`,
                  threshold: `${Math.round(similarityThreshold * 100)}%`,
                  isViolation: analysis.isViolation,
                  type: analysis.violationType || 'NONE'
                });
              }

              if (analysis.isViolation && onViolation) {
                console.warn('[AudioProctoring AI] 🚨 Violation Triggered:', analysis);
                onViolation({
                  type: analysis.violationType || 'UNKNOWN_SPEAKER_VOICE',
                  detail: analysis.reason || 'Kadrda begona shaxs ovozi aniqlandi',
                  confidence: analysis.confidence
                });
              }
            } catch (err) {
              console.warn('[AudioProctoring AI] Chunk decode error:', err);
            }
          };

          rec.start();
          setTimeout(() => {
            if (rec.state === 'recording') rec.stop();
          }, 1800);
        } catch {}
      }, CHUNK_DURATION_MS);

      setIsMonitoring(true);
      console.log('[AudioProctoring AI] ✓ Live Audio Stream Monitoring is ACTIVE');
    } catch (e) {
      console.warn('[AudioProctoring AI] Failed to start audio proctoring monitor:', e);
    }
  }, [
    isMonitoring,
    enabled,
    userId,
    activeContestId,
    similarityThreshold,
    detectUnknownSpeakers,
    detectMultipleSpeakers,
    onViolation
  ]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setIsMonitoring(false);
    setAudioLevel(0);
    console.log('[AudioProctoring AI] Audio monitoring STOPPED');
  }, []);

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    isEnrolled,
    isRecordingEnrollment,
    enrollProgress,
    audioLevel,
    isMonitoring,
    lastAnalysis,
    startEnrollment,
    startMonitoring,
    startLiveAudioStream: startMonitoring,
    stopMonitoring
  };
};
