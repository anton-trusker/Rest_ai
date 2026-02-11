import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Search, XCircle, Wine } from 'lucide-react';
import { Button } from '@/core/ui/button';
import { Progress } from '@/core/ui/progress';
import { Dialog, DialogContent } from '@/core/ui/dialog';

interface ScanProgressDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'barcode' | 'image';
    wineName?: string;
    onConfirm: () => void;
    onCreateNew?: () => void;
}

export default function ScanProgressDialog({
    open,
    onOpenChange,
    mode,
    wineName,
    onConfirm,
    onCreateNew
}: ScanProgressDialogProps) {
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState<'scanning' | 'analyzing' | 'found' | 'not_found'>('scanning');

    useEffect(() => {
        if (open) {
            setProgress(0);
            setStage('scanning');

            // Simulate progress
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 2; // rapid progress
                });
            }, 20);

            // Simulate stages
            const t1 = setTimeout(() => setStage('analyzing'), 800);
            const t2 = setTimeout(() => {
                setStage(wineName ? 'found' : 'not_found');
            }, 1500);

            return () => {
                clearInterval(interval);
                clearTimeout(t1);
                clearTimeout(t2);
            };
        }
    }, [open, wineName]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-6 border-none bg-background/95 backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col items-center justify-center text-center space-y-6 py-4">

                    {/* Visual Indicator */}
                    <div className="relative">
                        {stage === 'scanning' || stage === 'analyzing' ? (
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            </div>
                        ) : stage === 'found' ? (
                            <div className="w-20 h-20 rounded-full bg-wine-success/10 flex items-center justify-center animate-scale-in">
                                <CheckCircle2 className="w-10 h-10 text-wine-success" />
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center animate-shake">
                                <XCircle className="w-10 h-10 text-destructive" />
                            </div>
                        )}

                        {/* Mode Icon Badge */}
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border shadow-sm flex items-center justify-center">
                            {mode === 'barcode' ? (
                                <div className="font-mono text-[10px] font-bold">|||</div>
                            ) : (
                                <Search className="w-4 h-4 text-muted-foreground" />
                            )}
                        </div>
                    </div>

                    {/* Text Status */}
                    <div className="space-y-2">
                        <h3 className="font-heading font-semibold text-xl">
                            {stage === 'scanning' ? 'Scanning...' :
                                stage === 'analyzing' ? 'Analyzing Database...' :
                                    stage === 'found' ? 'Match Found!' : 'No Match Found'}
                        </h3>

                        {stage === 'found' ? (
                            <p className="font-medium text-lg text-primary">{wineName}</p>
                        ) : stage === 'not_found' ? (
                            <p className="text-muted-foreground">Product not in catalog</p>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                {mode === 'barcode' ? 'Looking up barcode...' : 'Identifying label...'}
                            </p>
                        )}
                    </div>

                    {/* Progress Bar (only during scan/analyze) */}
                    {(stage === 'scanning' || stage === 'analyzing') && (
                        <div className="w-full max-w-xs space-y-2">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground text-right">{progress}%</p>
                        </div>
                    )}

                    {/* Actions */}
                    {stage === 'found' && (
                        <div className="grid grid-cols-2 gap-3 w-full pt-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Rescan</Button>
                            <Button onClick={onConfirm}>Confirm & Add</Button>
                        </div>
                    )}

                    {stage === 'not_found' && (
                        <div className="grid grid-cols-2 gap-3 w-full pt-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Try Again</Button>
                            <Button variant="secondary" onClick={onCreateNew}>Add New Wine</Button>
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    );
}
