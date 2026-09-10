import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Maximize2,
  Minimize2,
  Lock,
  Volume2,
  VolumeX,
  SwitchCamera,
  ArrowLeft,
  Sparkles,
  Camera,
  AlertTriangle,
  CreditCard,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import FinexLogo from '@/components/FinexLogo';
import { validateGymAccess, chargeDayPassFromWallet } from '@/services/memberships';
import type { ValidateAccessResponse } from '@/types/memberships';
import { soundEffects } from '@/utils/audioAlerts';
import { toast } from 'sonner';

export const TotemCatraca: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<ValidateAccessResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChargingDayPass, setIsChargingDayPass] = useState(false);

  // Saída com PIN
  const [isExitPinModalOpen, setIsExitPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ code: string; timestamp: number }>({ code: '', timestamp: 0 });
  const resetTimerRef = useRef<any>(null);

  const isGym = user?.role === 'ACADEMIA' || user?.role === 'ADMIN';

  // Iniciar Leitor de Câmera
  const startScanner = useCallback(async (mode: 'environment' | 'user') => {
    try {
      setCameraError(null);

      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch {}
      }

      const qrScanner = new Html5Qrcode('totem-qr-reader');
      html5QrCodeRef.current = qrScanner;

      const config = {
        fps: 15,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
      };

      await qrScanner.start(
        { facingMode: mode },
        config,
        (decodedText) => {
          handleScannedCode(decodedText);
        },
        () => {}
      );

      setCameraActive(true);
    } catch (err: any) {
      console.error('Erro ao iniciar totem scanner:', err);
      setCameraActive(false);
      setCameraError(
        'Não foi possível iniciar a câmera da catraca. Verifique as permissões de vídeo.'
      );
    }
  }, []);

  useEffect(() => {
    startScanner(facingMode);

    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop();
        } catch {}
      }
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [facingMode, startScanner]);

  const handleScannedCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || isProcessing) return;

    // Debounce de 4 segundos para o mesmo código
    const now = Date.now();
    if (lastScannedRef.current.code === code && now - lastScannedRef.current.timestamp < 4000) {
      return;
    }
    lastScannedRef.current = { code, timestamp: now };

    try {
      setIsProcessing(true);
      const res = await validateGymAccess({ qrCode: code });
      setScanResult(res);

      if (res.granted) {
        // Sucesso
        if (soundEnabled) soundEffects.playSuccessChime();
        if (speechEnabled) {
          const name = res.student?.name?.split(' ')[0] || 'Aluno';
          soundEffects.speakText(`Acesso Liberado! Bem-vindo, ${name}!`);
        }
      } else {
        // Negado ou Day Pass
        if (res.isDayPass && res.hasEnoughBalance) {
          // Se for Day Pass com saldo suficiente, debita automaticamente na hora!
          if (res.student?.id) {
            try {
              setIsChargingDayPass(true);
              const chargeRes = await chargeDayPassFromWallet(res.student.id);
              if (chargeRes.granted) {
                setScanResult(chargeRes);
                if (soundEnabled) soundEffects.playSuccessChime();
                if (speechEnabled) {
                  const name = res.student?.name?.split(' ')[0] || 'Aluno';
                  soundEffects.speakText(`Day Pass debitado com sucesso! Bem-vindo, ${name}!`);
                }
              }
            } catch {
              if (soundEnabled) soundEffects.playErrorTone();
            } finally {
              setIsChargingDayPass(false);
            }
          }
        } else {
          if (soundEnabled) soundEffects.playErrorTone();
          if (speechEnabled) {
            soundEffects.speakText('Acesso Não Autorizado. Por favor, verifique na recepção.');
          }
        }
      }

      // Auto-reset após 4 segundos para voltar à tela de leitura contínua
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        setScanResult(null);
        setIsProcessing(false);
      }, 4000);
    } catch (err: any) {
      if (soundEnabled) soundEffects.playErrorTone();
      toast.error('Erro na validação do QR', { description: err?.message });
      setIsProcessing(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const toggleCameraFacing = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
  };

  const handleExitKiosk = () => {
    // PIN de saída rápida: 1234 ou volta direta
    navigate('/gestao-academia');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Header Superior do Totem */}
      <header className="p-4 sm:p-6 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <FinexLogo size="md" />
          <div className="hidden sm:block border-l border-white/20 pl-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary block">
              Totem Catraca & Recepção
            </span>
            <span className="text-sm font-semibold text-neutral-300">
              {user?.name || 'Academia Parceira'}
            </span>
          </div>
        </div>

        {/* Controles do Totem */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-10 w-10 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl"
            title={soundEnabled ? 'Silenciar Sons' : 'Ativar Sons'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={toggleCameraFacing}
            className="h-10 w-10 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl"
            title="Alternar Câmera"
          >
            <SwitchCamera className="w-5 h-5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={toggleFullscreen}
            className="h-10 w-10 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExitKiosk}
            className="h-10 px-3.5 text-xs font-semibold gap-1.5 border-white/20 hover:bg-white/10 text-neutral-300 rounded-xl"
          >
            <Lock className="w-3.5 h-3.5" /> Sair
          </Button>
        </div>
      </header>

      {/* Área Central: Scanner de Câmera ou Card de Acesso */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative">
        {scanResult ? (
          /* Card Gigante de Resultado do Acesso */
          <div
            className={`w-full max-w-lg p-6 sm:p-8 rounded-3xl border-4 text-center shadow-2xl transition-all animate-fade-in ${
              scanResult.granted
                ? 'border-emerald-500 bg-emerald-950/40 shadow-emerald-500/20'
                : 'border-rose-500 bg-rose-950/40 shadow-rose-500/20'
            }`}
          >
            {/* Foto do Aluno em Destaque */}
            <div className="relative mx-auto mb-4 w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 overflow-hidden shadow-2xl flex items-center justify-center bg-neutral-900 border-white/20">
              {scanResult.student?.avatarUrl ? (
                <img
                  src={scanResult.student.avatarUrl}
                  alt={scanResult.student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-16 h-16 text-neutral-500" />
              )}

              <div
                className={`absolute bottom-0 inset-x-0 py-1 text-center text-[11px] font-black uppercase tracking-wider text-white ${
                  scanResult.granted ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {scanResult.granted ? 'Liberado' : 'Bloqueado'}
              </div>
            </div>

            {/* Nome do Aluno */}
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
              {scanResult.student?.name || 'Visitante Finex'}
            </h2>

            {/* Mensagem e Status */}
            <div className="mt-3">
              {scanResult.granted ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-sm uppercase tracking-wider border border-emerald-500/40">
                  <CheckCircle2 className="w-5 h-5" /> Acesso Liberado
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 font-black text-sm uppercase tracking-wider border border-rose-500/40">
                  <XCircle className="w-5 h-5" /> Acesso Negado
                </div>
              )}

              <p className="text-sm text-neutral-300 mt-2 max-w-sm mx-auto">
                {scanResult.message || scanResult.reason}
              </p>
            </div>

            {/* Detalhes do Plano ou Day Pass */}
            {scanResult.enrollment && (
              <div className="mt-4 p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-around text-xs">
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase">Plano</span>
                  <span className="font-bold text-white">{scanResult.enrollment.planName}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase">Dias Restantes</span>
                  <span className="font-bold text-emerald-400">
                    {scanResult.enrollment.daysRemaining} dias
                  </span>
                </div>
              </div>
            )}

            {/* Barra de Retorno Automático */}
            <div className="mt-6 pt-3 border-t border-white/10 text-xs text-neutral-400 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span>Pronto para o próximo aluno em instantes...</span>
            </div>
          </div>
        ) : (
          /* Modo Scanner Contínuo de QR Code */
          <div className="flex flex-col items-center justify-center text-center space-y-5 max-w-md w-full">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
                Aproxime seu QR Code
              </h2>
              <p className="text-sm text-neutral-400">
                Abra o passe digital no app Finex e aponte para a câmera da catraca.
              </p>
            </div>

            {/* Câmera Stream */}
            <div className="relative w-72 sm:w-80 h-72 sm:h-80 rounded-3xl overflow-hidden border-4 border-primary/60 shadow-2xl bg-black flex items-center justify-center ring-4 ring-primary/20">
              <div id="totem-qr-reader" className="w-full h-full" />

              {/* Guia Visual do Scanner */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-56 h-56 border-2 border-dashed border-primary/70 rounded-2xl relative">
                  {/* Linha laser de scan animada */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-lg shadow-primary" />
                </div>
              </div>

              {cameraError && (
                <div className="absolute inset-0 bg-neutral-950/90 p-4 flex flex-col items-center justify-center text-center">
                  <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
                  <p className="text-xs text-neutral-300">{cameraError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startScanner(facingMode)}
                    className="mt-3 text-xs"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-400 bg-white/5 py-2 px-4 rounded-full border border-white/10">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Validação biométrica e débito instantâneo</span>
            </div>
          </div>
        )}
      </main>

      {/* Rodapé do Totem */}
      <footer className="p-4 border-t border-white/10 bg-black/40 text-center text-xs text-neutral-500">
        Finex Pass • Sistema Inteligente de Acesso a Catracas e Academias
      </footer>
    </div>
  );
};

export default TotemCatraca;
