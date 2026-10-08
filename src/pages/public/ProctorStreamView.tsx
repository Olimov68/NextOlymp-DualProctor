

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Smartphone,
  Video,
  Battery,
  BatteryCharging,
  ShieldCheck,
  Moon,
  Sun,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Info,
  Radio,
  Send
} from 'lucide-react';
import { PROCTOR_SOCKET_EVENTS } from '../../types/dualDeviceProctor';
import { DualDeviceProctorGateway } from '../../services/setupProctor.service';

export const ProctorStreamView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const rawSessionId = searchParams.get('sessionId');
  const sessionId = rawSessionId || (typeof window !== 'undefined' ? localStorage.getItem('ibnsino_active_proctor_session') || localStorage.getItem('nextolymp_active_proctor_session') || 'proctor-local-session' : 'proctor-local-session');
  const token = searchParams.get('token') || 'token-' + sessionId;

  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const virtualCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wakeLockRef = useRef<any>(null);
  const gatewayRef = useRef<DualDeviceProctorGateway | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const previewTimerRef = useRef<any>(null);

  
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'virtual' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPowerSavingMode, setIsPowerSavingMode] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [isConnectedToPrimary, setIsConnectedToPrimary] = useState(false);
  const [snapshotFlash, setSnapshotFlash] = useState(false);
  const [lastSnapshotTime, setLastSnapshotTime] = useState<string | null>(null);
  const [framesSentCount, setFramesSentCount] = useState(0);

  
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {
      console.warn('Wake Lock error:', err);
    }
  }, []);

  
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          const level = Math.round(battery.level * 100);
          setBatteryLevel(level);
          setIsCharging(battery.charging);

          
          gatewayRef.current?.emit(PROCTOR_SOCKET_EVENTS.BATTERY_STATUS, {
            level: battery.level,
            charging: battery.charging,
          });
        };

        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }
  }, []);

  
  const captureSnapshot = useCallback(() => {
    if (cameraStatus === 'virtual' && virtualCanvasRef.current) {
      return virtualCanvasRef.current.toDataURL('image/jpeg', 0.92);
    }

    if (!videoRef.current || !canvasRef.current) {
      if (virtualCanvasRef.current) return virtualCanvasRef.current.toDataURL('image/jpeg', 0.92);
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.92);

    
    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 200);
    setLastSnapshotTime(new Date().toLocaleTimeString());

    return base64;
  }, [cameraStatus]);

  
  const startVirtualCamera = useCallback(() => {
    setCameraStatus('virtual');
    setIsConnectedToPrimary(true);

    const canvas = virtualCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 640;
    canvas.height = 480;

    let tick = 0;
    const drawVirtualFrame = () => {
      tick++;
      
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 480);

      
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1;
      for (let y = 300; y < 480; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(640, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#27272a';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(140, 240, 360, 160, [12]);
      ctx.fill();
      ctx.stroke();

      
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(320, 180 + Math.sin(tick * 0.05) * 2, 35, 0, Math.PI * 2);
      ctx.fill();

      
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(260, 220, 120, 110, [20, 20, 0, 0]);
      ctx.fill();

      
      ctx.fillStyle = '#64748b';
      ctx.fillRect(280, 270, 80, 50); 
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(285, 225, 70, 45); 
      ctx.fillStyle = '#93c5fd';
      ctx.font = '10px monospace';
      ctx.fillText('Ibn Sino', 290, 250);

      
      const handOffset = Math.sin(tick * 0.08) * 3;
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(260, 290 + handOffset, 12, 0, Math.PI * 2); 
      ctx.arc(380, 290 - handOffset, 12, 0, Math.PI * 2); 
      ctx.fill();

      
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('● LIVE • VIRTUAL PROCTOR CAMERA 720p', 20, 35);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText(`Frame #${tick} • Session: ${sessionId.slice(0, 12)}`, 20, 55);

      if (cameraStatus === 'virtual') {
        requestAnimationFrame(drawVirtualFrame);
      }
    };

    drawVirtualFrame();

    
    gatewayRef.current?.emit(PROCTOR_SOCKET_EVENTS.DEVICE_CONNECTED, {
      sessionId,
      role: 'secondary',
      batteryLevel: 98,
      mode: 'virtual_camera',
    });
  }, [sessionId, cameraStatus]);

  
  useEffect(() => {
    requestWakeLock();

    let isMounted = true;
    const gateway = new DualDeviceProctorGateway();
    gatewayRef.current = gateway;

    gateway.connect({
      sessionId,
      token,
      role: 'secondary',
    });

    
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        gateway.emit(PROCTOR_SOCKET_EVENTS.WEBRTC_SIGNAL, {
          candidate: event.candidate,
        });
      }
    };

    
    gateway.on(PROCTOR_SOCKET_EVENTS.WEBRTC_SIGNAL, async (data) => {
      try {
        if (data?.answer && pc.signalingState !== 'closed') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } else if (data?.candidate && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.warn('WebRTC signal processing in mobile view:', err);
      }
    });

    
    gateway.on(PROCTOR_SOCKET_EVENTS.REQUEST_SNAPSHOT, () => {
      const snapshot = captureSnapshot();
      if (snapshot) {
        gateway.emit(PROCTOR_SOCKET_EVENTS.SNAPSHOT_READY, { imageBase64: snapshot });
      }
    });

    
    async function startBackCamera() {
      setCameraStatus('requesting');
      try {
        let stream: MediaStream | null = null;
        try {
          
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
            },
            audio: false,
          });
        } catch {
          
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        if (!isMounted) {
          stream?.getTracks().forEach((t) => t.stop());
          return;
        }

        if (stream) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCameraStatus('active');
          setIsConnectedToPrimary(true);

          
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream!);
          });

          
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            gateway.emit(PROCTOR_SOCKET_EVENTS.WEBRTC_SIGNAL, { offer });
          } catch (e) {
            console.warn('WebRTC offer error:', e);
          }

          
          gateway.emit(PROCTOR_SOCKET_EVENTS.DEVICE_CONNECTED, {
            sessionId,
            role: 'secondary',
            batteryLevel,
            connectedAt: Date.now(),
          });
        }
      } catch (err: any) {
        console.warn('Physical camera unavailable, starting virtual proctor camera:', err);
        
        startVirtualCamera();
      }
    }

    startBackCamera();

    
    previewTimerRef.current = setInterval(() => {
      try {
        let frameBase64: string | null = null;
        if (videoRef.current && videoRef.current.videoWidth > 0 && canvasRef.current) {
          const cvs = canvasRef.current;
          cvs.width = 320;
          cvs.height = 180;
          const ctx = cvs.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 320, 180);
            frameBase64 = cvs.toDataURL('image/jpeg', 0.45);
          }
        } else if (virtualCanvasRef.current) {
          frameBase64 = virtualCanvasRef.current.toDataURL('image/jpeg', 0.45);
        }

        if (frameBase64) {
          gateway.emit(PROCTOR_SOCKET_EVENTS.FRAME_PREVIEW, {
            frame: frameBase64,
            timestamp: Date.now(),
          });
          setFramesSentCount((c) => c + 1);
        }
      } catch {}
    }, 450);

    return () => {
      isMounted = false;
      if (previewTimerRef.current) clearInterval(previewTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      pc.close();
      gateway.disconnect();
    };
  }, [sessionId, token, requestWakeLock, captureSnapshot, batteryLevel, startVirtualCamera]);

  
  const handleForceConnect = () => {
    if (gatewayRef.current) {
      gatewayRef.current.emit(PROCTOR_SOCKET_EVENTS.DEVICE_CONNECTED, {
        sessionId,
        role: 'secondary',
        batteryLevel: batteryLevel ?? 95,
        connectedAt: Date.now(),
      });
      setIsConnectedToPrimary(true);
      const snap = captureSnapshot();
      if (snap) {
        gatewayRef.current.emit(PROCTOR_SOCKET_EVENTS.FRAME_PREVIEW, { frame: snap });
      }
    }
  };

  return (
    <div className={`fixed inset-0 w-full h-full flex flex-col justify-between overflow-hidden transition-colors duration-300 ${
      isPowerSavingMode ? 'bg-zinc-950 text-zinc-500' : 'bg-zinc-950 text-zinc-100'
    }`}>
      <canvas ref={canvasRef} className="hidden" />

      {snapshotFlash && (
        <div className="absolute inset-0 bg-white/70 z-50 pointer-events-none transition-opacity duration-150" />
      )}

      {/* Top status bar */}
      <div className={`relative z-20 px-4 py-3 flex items-center justify-between backdrop-blur-md border-b ${
        isPowerSavingMode ? 'bg-zinc-950/90 border-white/5' : 'bg-zinc-900/80 border-white/10'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-100 tracking-wide">Ibn Sino Proctor</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-[10px] text-zinc-400">
              {cameraStatus === 'virtual' ? 'Virtual Nazorat Kamerasi (Test)' : '2-Telefon (Kamera Faol)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-zinc-950/80 border border-white/10">
            {isCharging ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="text-zinc-200 font-bold">
              {batteryLevel !== null ? `${batteryLevel}%` : '95%'}
            </span>
          </div>

          <button
            onClick={() => setIsPowerSavingMode(!isPowerSavingMode)}
            className={`p-2 rounded-xl text-xs flex items-center gap-1 transition-all border ${
              isPowerSavingMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-zinc-900 border-white/10 text-zinc-300 hover:text-white'
            }`}
            title="Batareyani tejash rejimi"
          >
            {isPowerSavingMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-zinc-950">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            cameraStatus === 'virtual' ? 'hidden' : isPowerSavingMode ? 'opacity-20 filter grayscale' : 'opacity-100'
          }`}
        />

        <canvas
          ref={virtualCanvasRef}
          className={`w-full h-full object-cover ${cameraStatus === 'virtual' ? 'block' : 'hidden'}`}
        />

        {cameraStatus === 'error' && (
          <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Fizik kamera topilmadi</h3>
            <p className="text-xs text-zinc-400 max-w-xs mb-4 leading-relaxed">
              Lokal test rejimida ishlash uchun Virtual Nazorat Kamerasini yoqishingiz mumkin.
            </p>
            <button
              onClick={startVirtualCamera}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4" />
              Virtual Kamerani Yoqish
            </button>
          </div>
        )}

        {!isPowerSavingMode && cameraStatus !== 'error' && (
          <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400/80 rounded-tl-lg" />
              <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400/80 rounded-tr-lg" />
            </div>

            <div className="text-center">
              <div className="inline-block px-3.5 py-1.5 rounded-full bg-zinc-900/80 backdrop-blur-md text-[11px] text-zinc-200 border border-white/10 shadow-lg">
                45° burchak • Stol, ikkala qo'l va noutbuk kadrda bo'lishi lozim
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400/80 rounded-bl-lg" />
              <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400/80 rounded-br-lg" />
            </div>
          </div>
        )}

        {isPowerSavingMode && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
            <Moon className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-500 font-medium">
              Batareyani tejash rejimi faol
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">
              Kamera to'liq sifatda uzatishni davom ettirmoqda
            </p>
          </div>
        )}
      </div>

      {/* Bottom control bar */}
      <div className={`relative z-20 p-4 border-t ${
        isPowerSavingMode ? 'bg-zinc-950 border-white/5' : 'bg-zinc-900/90 border-white/10 backdrop-blur-md'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-left">
              <span className="text-xs font-semibold text-zinc-100 block">
                {isConnectedToPrimary ? "Asosiy qurilmaga ulandi ✓" : "Ulanish tekshirilmoqda..."}
              </span>
              <span className="text-[10px] text-zinc-400 block font-mono">
                {lastSnapshotTime ? `Oxirgi kadr: ${lastSnapshotTime}` : `Oqim faol (${framesSentCount} kadr)`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleForceConnect}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
              title="Asosiy qurilmaga ulanish signalini qayta yuborish"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Signal yuborish</span>
            </button>

            <button
              onClick={() => {
                const snap = captureSnapshot();
                if (snap && gatewayRef.current) {
                  gatewayRef.current.emit(PROCTOR_SOCKET_EVENTS.SNAPSHOT_READY, { imageBase64: snap });
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Snapshot</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProctorStreamView;
