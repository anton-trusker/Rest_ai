import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import CountSetup from '@/components/count/CountSetup';
import CameraScanner from '@/components/count/CameraScanner';
import SessionSummary from '@/components/count/SessionSummary';
import { useSessionStore } from '@/stores/sessionStore';
import { Loader2 } from 'lucide-react';

type Phase = 'setup' | 'scanning' | 'summary';

export default function InventoryCount() {
  const navigate = useNavigate();
  const { createSession, updateSessionStatus, submitCount, currentSession, currentItems, fetchSessionItems, loading } = useSessionStore();
  
  const [phase, setPhase] = useState<Phase>('setup');
  const [countType, setCountType] = useState('full');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime] = useState(() => Date.now());

  // Count local state for UI feedback
  const [countedCount, setCountedCount] = useState(0);

  useEffect(() => {
    if (sessionId && phase === 'scanning') {
       // Poll or subscribe to updates if needed
    }
  }, [sessionId, phase]);

  const handleStartSession = async () => {
    const id = await createSession(countType, `${countType.toUpperCase()} Count ${new Date().toLocaleDateString()}`);
    if (id) {
      setSessionId(id);
      setPhase('scanning');
      toast.success('Session started');
    }
  };

  const handleCount = useCallback(async (wineId: string, unopened: number, opened: number, method: string) => {
    if (!sessionId) return;
    const success = await submitCount(sessionId, wineId, unopened, opened, method);
    if (success) {
      setCountedCount(c => c + 1);
    }
  }, [sessionId, submitCount]);

  const handleEndSession = useCallback(async () => {
    if (!sessionId) return;
    
    // Fetch latest items for summary
    await fetchSessionItems(sessionId);
    
    if (currentItems.length === 0 && countedCount === 0) {
      // If nothing counted, maybe cancel?
      if (confirm("Nothing counted. Cancel session?")) {
        await updateSessionStatus(sessionId, 'cancelled'); // Assuming 'cancelled' status exists or handle deletion
        setPhase('setup');
        setSessionId(null);
        toast.info('Session cancelled');
        return;
      }
    }
    
    setPhase('summary');
  }, [sessionId, currentItems.length, countedCount, fetchSessionItems, updateSessionStatus]);

  const handleCompleteSession = async () => {
    if (sessionId) {
      await updateSessionStatus(sessionId, 'completed');
      navigate('/dashboard');
      toast.success('Inventory session completed');
    }
  };

  if (loading && phase === 'setup' && !sessionId) {
      // creating session
      return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  if (phase === 'setup') {
    return (
      <CountSetup
        countType={countType}
        onCountTypeChange={setCountType}
        onStart={handleStartSession}
      />
    );
  }

  if (phase === 'summary' && sessionId) {
    const duration = Math.floor((Date.now() - startTime) / 1000);

    return (
      <SessionSummary
        sessionId={sessionId}
        sessionName={currentSession?.session_name || 'Session'}
        items={currentItems as any} // Map types if needed
        duration={duration}
        onStartNew={() => { setSessionId(null); setCountedCount(0); setPhase('setup'); }}
        onClose={handleCompleteSession}
      />
    );
  }

  if (sessionId) {
    return (
      <CameraScanner
        sessionId={sessionId}
        counted={countedCount}
        onCount={handleCount}
        onEndSession={handleEndSession}
      />
    );
  }
  
  return null;
}

