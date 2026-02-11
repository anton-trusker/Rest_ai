import { useRef, useEffect } from 'react';
import { useBarcodeScanner } from '@/core/lib/hooks/useBarcodeScanner';
import { Button } from '@/core/ui/button';
import { X, Camera, SwitchCamera, Zap, ZapOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CameraScannerProps {
    onScan: (code: string) => void;
    onClose: () => void;
    active: boolean;
}

export default function CameraScanner({ onScan, onClose, active }: CameraScannerProps) {
    const { startScanning, stopScanning, isScanning, error } = useBarcodeScanner(
        'reader',
        onScan,
        active
    );

    // Restart scanning if active changes
    useEffect(() => {
        if (active && !isScanning) {
            startScanning();
        } else if (!active && isScanning) {
            stopScanning();
        }
    }, [active, isScanning, startScanning, stopScanning]);

    if (!active) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center">
            {/* Top Bar */}
            <div className="w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                <Button variant="ghost" size="icon" onClick={() => { toast.info("Torch toggle simulated") }} className="rounded-full bg-black/20 text-white hover:bg-black/40">
                    <ZapOff className="w-6 h-6" />
                </Button>
                <span className="text-white font-medium text-sm tracking-wide bg-black/30 px-3 py-1 rounded-full backdrop-blur-md">
                    Align barcode in frame
                </span>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-black/20 text-white hover:bg-black/40">
                    <X className="w-6 h-6" />
                </Button>
            </div>

            {/* Camera Viewport */}
            <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-black">
                <div id="reader" className="w-full h-full object-cover [&>video]:object-cover [&>video]:h-full [&>video]:w-full" />

                {/* Overlay Guides */}
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                    <div className="w-[70%] max-w-[300px] aspect-[1.5/1] border-2 border-white/80 rounded-lg relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary -mt-0.5 -ml-0.5 rounded-tl-sm" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary -mt-0.5 -mr-0.5 rounded-tr-sm" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary -mb-0.5 -ml-0.5 rounded-bl-sm" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary -mb-0.5 -mr-0.5 rounded-br-sm" />

                        {/* Scanning line animation */}
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/80 shadow-[0_0_10px_rgba(255,0,0,0.8)] animate-scan-y" />
                    </div>
                </div>

                {error && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-destructive/90 text-white px-4 py-3 rounded-lg z-30 text-center max-w-[80%]">
                        <p className="font-bold mb-1">Camera Error</p>
                        <p className="text-sm">{error}</p>
                        <p className="text-xs mt-2 opacity-80">Check permissions</p>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="w-full p-6 pb-8 bg-black z-20 flex justify-center items-center gap-8 text-white">
                <div className="flex flex-col items-center gap-2 opacity-50 text-xs">
                    <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 border border-white/20">
                        <SwitchCamera className="w-6 h-6" />
                    </Button>
                    <span>Flip</span>
                </div>

                <div className="flex flex-col items-center gap-3 relative -top-4">
                    <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform" onClick={() => { toast.info("Image capture logic simulated") }}>
                        <div className="w-12 h-12 rounded-full bg-white" />
                    </div>
                    <span className="text-xs font-medium">Capture Label</span>
                </div>

                <div className="flex flex-col items-center gap-2 text-xs">
                    <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 border border-white/20 hover:bg-white/20 hover:text-white" onClick={() => toast.info('Input code manually')}>
                        <span className="font-mono font-bold text-lg">123</span>
                    </Button>
                    <span>Manual</span>
                </div>
            </div>
        </div>
    );
}
