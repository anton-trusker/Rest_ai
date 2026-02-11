import { useState } from "react";
import { Button } from "@/core/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/core/ui/dialog";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import { Textarea } from "@/core/ui/textarea";
import { Plus, Minus } from "lucide-react";

interface QuantityPopupProps {
    product: {
        id: string;
        name: string;
        unit: string;
    };
    onSave: (quantity: number, quantityOpened: number) => void;
    onClose: () => void;
}

export default function QuantityPopup({ product, onSave, onClose }: QuantityPopupProps) {
    const [quantity, setQuantity] = useState(0);
    const [quantityOpened, setQuantityOpened] = useState(0);
    const [notes, setNotes] = useState("");

    const handleIncrement = (amount: number) => {
        setQuantity(prev => Math.max(0, prev + amount));
    };

    const handleSave = () => {
        onSave(quantity, quantityOpened);
        onClose();
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{product.name}</DialogTitle>
                    <DialogDescription className="capitalize">
                        Enter quantity in {product.unit}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Quick Add Buttons */}
                    <div className="space-y-3">
                        <Label>Quick Add</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => handleIncrement(1)}
                                size="lg"
                            >
                                +1
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleIncrement(6)}
                                size="lg"
                            >
                                +6
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleIncrement(12)}
                                size="lg"
                            >
                                +12
                            </Button>
                        </div>
                    </div>

                    {/* Full Bottles */}
                    <div className="space-y-3">
                        <Label>Full {product.unit}</Label>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setQuantity(prev => Math.max(0, prev - 1))}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                                className="text-center text-lg font-semibold"
                                min="0"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setQuantity(prev => prev + 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Partial/Opened */}
                    <div className="space-y-3">
                        <Label>Opened/Partial (Optional)</Label>
                        <Input
                            type="number"
                            value={quantityOpened}
                            onChange={(e) => setQuantityOpened(Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="0.5, 0.75, etc."
                            step="0.1"
                            min="0"
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <Label>Notes (Optional)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes..."
                            rows={2}
                        />
                    </div>

                    {/* Total */}
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Count</p>
                        <p className="text-2xl font-bold">
                            {quantity + quantityOpened} {product.unit}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} className="flex-1" disabled={quantity === 0 && quantityOpened === 0}>
                            Save Count
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
