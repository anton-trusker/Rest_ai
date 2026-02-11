import { ChevronRight, ChevronDown, Folder, FolderOpen, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { Category } from '@/stores/productStore';

interface CategoryTreeProps {
    categories: Category[]; // The root level tree
    selectedId: string | null;
    onSelect: (id: string | null) => void;
}

const TreeNode = ({ node, selectedId, onSelect, depth = 0 }: {
    node: Category;
    selectedId: string | null;
    onSelect: (id: string) => void;
    depth?: number;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;

    return (
        <div>
            <div
                className={cn(
                    "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors text-sm",
                    isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent text-muted-foreground",
                    depth > 0 && "ml-4"
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(node.id);
                    if (hasChildren) setIsOpen(!isOpen); // Auto toggle on select?
                }}
            >
                <button
                    type="button"
                    className={cn("p-0.5 rounded hover:bg-black/5", !hasChildren && "invisible")}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                >
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>

                {isOpen ? <FolderOpen className="w-4 h-4 text-amber-500/80" /> : <Folder className="w-4 h-4 text-amber-500/60" />}
                <span className="truncate">{node.name}</span>
            </div>

            {isOpen && hasChildren && (
                <div className="border-l border-border/50 ml-3 pl-1">
                    {node.children!.map(child => (
                        <TreeNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function CategoryTree({ categories, selectedId, onSelect }: CategoryTreeProps) {
    return (
        <div className="space-y-1">
            <div
                className={cn(
                    "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors text-sm mb-2",
                    selectedId === null ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent text-muted-foreground"
                )}
                onClick={() => onSelect(null)}
            >
                <div className="w-4 h-4 flex items-center justify-center"><Box className="w-3.5 h-3.5" /></div>
                <span>All Categories</span>
            </div>

            {categories.map(root => (
                <TreeNode key={root.id} node={root} selectedId={selectedId} onSelect={(id) => onSelect(id!)} />
            ))}
        </div>
    );
}
