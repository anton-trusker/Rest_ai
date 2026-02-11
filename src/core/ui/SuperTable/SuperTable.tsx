import React, { useState, useEffect } from "react";
import DataTable, { DataTableColumn } from "../DataTable";

interface SuperTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    onRowClick?: (item: T) => void;
}

export function SuperTable<T>({ data, columns, onRowClick }: SuperTableProps<T>) {
    const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

    // Initialize visible columns
    useEffect(() => {
        if (columns.length > 0) {
            setVisibleColumns(columns.map(c => c.key));
        }
    }, [columns]);

    const handleColumnResize = (key: string, width: number) => {
        setColumnWidths(prev => ({
            ...prev,
            [key]: width
        }));
    };

    return (
        <div className="w-full">
            {/* Future: Add toolbar for column visibility, filters, etc. here */}
            <DataTable
                data={data}
                columns={columns}
                visibleColumns={visibleColumns}
                columnWidths={columnWidths}
                onColumnResize={handleColumnResize}
                onRowClick={onRowClick}
                keyExtractor={(item: T) => {
                    const i = item as T & { id?: string; product_id?: string };
                    return i.id || i.product_id || JSON.stringify(item);
                }}
            />
        </div>
    );
}
