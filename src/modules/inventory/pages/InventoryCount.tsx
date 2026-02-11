import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Wine, mockWines } from '@/core/lib/mockData';
import CountSetup from '../components/CountSetup';
import CameraScanner from '../components/CameraScanner';
import ScanProgressDialog from '../components/ScanProgressDialog';
import ManualSearchSheet from '../components/ManualSearchSheet';
import QuantityPopup from '../components/QuantityPopup';
import SessionSummary from '../components/SessionSummary';

type Step = 'setup' | 'counting' | 'summary';

export default function InventoryCount() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('setup');

    // Scanner State
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [showScanProgress, setShowScanProgress] = useState(false);
    const [scanMode, setScanMode] = useState<'barcode' | 'image'>('barcode');

    // Manual Search State
    const [showManualSearch, setShowManualSearch] = useState(false);

    // Current Item State (for quantity popup)
    const [scannedWine, setScannedWine] = useState<Wine | null>(null);
    const [showQuantityPopup, setShowQuantityPopup] = useState(false);

    // Session State
    const [sessionData, setSessionData] = useState<{
        id: string;
        itemsCounted: number;
        startTime: string;
    } | null>(null);

    const startSession = () => {
        setSessionData({
            id: `S-${Date.now()}`,
            itemsCounted: 0,
            startTime: new Date().toISOString()
        });
        setStep('counting'); // Immediately go to camera in a real app, but for now we might want a dashboard?
        // Let's assume we want to start scanning immediately
        setIsCameraActive(true);
    };

    const handleScanDetected = useCallback((code: string) => {
        setIsCameraActive(false); // Pause camera
        setScanMode('barcode');
        setShowScanProgress(true);

        // Simulate lookup
        setTimeout(() => {
            // Find a mock wine (e.g. first one) for demo
            const found = mockWines.find(w => w.barcode === code) || mockWines[0];
            setScannedWine(found);
            // Let the dialog show "Found" state
        }, 1500);
    }, []);

    const handleManualSelect = (wine: Wine) => {
        setShowManualSearch(false);
        setScannedWine(wine);
        setShowQuantityPopup(true);
    };

    const confirmQuantity = (unopened: number, opened: number, notes?: string, location?: string) => {
        // Save item logic would go here
        if (sessionData) {
            setSessionData({
                ...sessionData,
                itemsCounted: sessionData.itemsCounted + 1
            });
        }
        toast.success('Count recorded', { description: `${scannedWine?.name}` });

        // Resume scanning
        setIsCameraActive(true);
    };

    if (step === 'setup') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] p-4">
                <CountSetup onStart={startSession} />
            </div>
        );
    }

    if (step === 'summary') {
        return (
            <SessionSummary
                session={{
                    id: sessionData?.id || '',
                    sessionName: 'New Session',
                    sessionType: 'full',
                    status: 'completed',
                    totalWinesExpected: 10,
                    totalWinesCounted: sessionData?.itemsCounted || 0,
                    startedAt: sessionData?.startTime || '',
                    completedAt: new Date().toISOString(),
                    duration: 300,
                    createdBy: '1',
                    createdByName: 'User'
                }}
                count={sessionData?.itemsCounted || 0}
            />
        );
    }

    return (
        <div className="flex flex-col h-full">
            <CameraScanner
                active={isCameraActive}
                onScan={handleScanDetected}
                onClose={() => {
                    setIsCameraActive(false);
                    navigate('/inventory'); // Go back if cancelled
                }}
            />

            {/* Fallback/Manual Options if camera is closed but we are in counting mode? 
          Actually CameraScanner takes full screen. If closed, we likely cancel session or pause.
          For this demo, let's say closing camera goes to summary or manual menu.
      */}
            {!isCameraActive && (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] gap-4">
                    <Button onClick={() => setIsCameraActive(true)} size="lg">Resume Scanning</Button>
                    <Button variant="secondary" onClick={() => setShowManualSearch(true)}>Manual Search</Button>
                    <Button variant="outline" onClick={() => setStep('summary')}>Finish Session</Button>
                </div>
            )}

            {/* Overlays */}
            <ScanProgressDialog
                open={showScanProgress}
                onOpenChange={(open) => {
                    setShowScanProgress(open);
                    if (!open) setIsCameraActive(true); // Resume if closed without confirm
                }}
                mode={scanMode}
                wineName={scannedWine?.name}
                onConfirm={() => {
                    setShowScanProgress(false);
                    setShowQuantityPopup(true);
                }}
                onCreateNew={() => {
                    setShowScanProgress(false);
                    toast.info("Create new wine flow");
                }}
            />

            <QuantityPopup
                wine={scannedWine}
                isOpen={showQuantityPopup}
                onClose={() => {
                    setShowQuantityPopup(false);
                    setIsCameraActive(true); // Resume on close
                }}
                onConfirm={confirmQuantity}
            />

            <ManualSearchSheet
                open={showManualSearch}
                onOpenChange={setShowManualSearch}
                onSelect={handleManualSelect}
            />
        </div>
    );
}
