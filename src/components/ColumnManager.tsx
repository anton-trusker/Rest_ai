import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';

export interface ColumnDef {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

interface ColumnManagerProps {
  columns: ColumnDef[];
  visibleColumns: string[];
  onChange: (visible: string[]) => void;
}

export default function ColumnManager({ columns, visibleColumns, onChange }: ColumnManagerProps) {
  const toggle = (key: string) => {
    if (visibleColumns.includes(key)) {
      if (visibleColumns.length <= 2) return; // min 2 columns
      onChange(visibleColumns.filter(k => k !== key));
    } else {
      onChange([...visibleColumns, key]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-11 w-11 border-border" title="Manage columns">
          <Settings2 className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-3 bg-popover border-border">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Visible Columns</p>
        <div className="space-y-2">
          {columns.map(col => (
            <label key={col.key} className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 rounded-md p-1.5 -mx-1 transition-colors">
              <Checkbox
                checked={visibleColumns.includes(col.key)}
                onCheckedChange={() => toggle(col.key)}
                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-sm">{col.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
