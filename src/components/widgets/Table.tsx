'use client';

import {User} from 'lucide-react';
import {motion} from 'framer-motion';
import {cn} from '@/lib/utils';

const defaultRows = [
    {
        name: (
            <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-muted'>
                    <User />
                </div>
                <div>
                    <p className='font-medium'>Meeting Notes</p>
                    <p className='text-xs text-muted-foreground'>
                        Shared with 3 people
                    </p>
                </div>
            </div>
        ),
        app: 'Notion',
        size: '2 MB',
        modified: '2023-09-12'
    }
];

const defaultColumns = [
    {key: 'name', label: 'Nombre'},
    {key: 'app', label: 'App'},
    {key: 'size', label: 'Tamaño'},
    {key: 'modified', label: 'Modificado'}
];

type CellValue =
    | React.ReactNode
    | {
          primary: React.ReactNode;
          secondary?: React.ReactNode;
      };

type RowData = Record<string, CellValue>;

function isCellWithSecondary(value: CellValue): value is {
    primary: React.ReactNode;
    secondary?: React.ReactNode;
} {
    return typeof value === 'object' && value !== null && 'primary' in value;
}

export interface TableColumn {
    key: string;
    label: string;
    headerClassName?: string;
    cellClassName?: string;
}

interface TableProps {
    columns: TableColumn[];
    rows: RowData[];
    isLoading?: boolean;
}

const rowClassName =
    'p-3 flex w-full flex-col items-stretch gap-3 text-left md:grid md:items-center md:gap-0';

function getGridStyle(columnCount: number) {
    return {
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`
    };
}

function renderCellContent(cell: CellValue) {
    if (isCellWithSecondary(cell)) {
        return (
            <div className='flex flex-col gap-0.5 text-left'>
                <div>{cell.primary}</div>
                {cell.secondary ? (
                    <div className='text-xs text-muted-foreground'>
                        {cell.secondary}
                    </div>
                ) : null}
            </div>
        );
    }

    return cell as React.ReactNode;
}

function TableCell({
    column,
    children
}: {
    column: TableColumn;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                'w-full min-w-0 text-left',
                column.cellClassName ?? 'text-sm md:text-base'
            )}>
            <div className='mb-0.5 text-xs font-medium text-muted-foreground md:hidden'>
                {column.label}
            </div>
            {children}
        </div>
    );
}

function TableRow({columns, row}: {columns: TableColumn[]; row: RowData}) {
    return (
        <motion.div
            whileHover={{backgroundColor: 'rgba(0,0,0,0.02)'}}
            className={rowClassName}
            style={getGridStyle(columns.length)}>
            {columns.map(column => (
                <TableCell key={column.key} column={column}>
                    {renderCellContent(row[column.key])}
                </TableCell>
            ))}
        </motion.div>
    );
}

export default function Table({
    columns = defaultColumns,
    rows = defaultRows,
    isLoading = false
}: Partial<TableProps>) {
    return (
        <div className='rounded-3xl border overflow-hidden'>
            <div
                className='bg-muted/50 p-3 hidden md:grid text-left text-sm font-medium'
                style={getGridStyle(columns.length)}>
                {columns.map(column => (
                    <div key={column.key} className={column.headerClassName}>
                        {column.label}
                    </div>
                ))}
            </div>
            <div className='divide-y'>
                {isLoading
                    ? Array.from({length: 3}).map((_, index) => (
                          <div
                              key={index}
                              className={rowClassName}
                              style={getGridStyle(columns.length)}>
                              {columns.map(column => (
                                  <TableCell key={column.key} column={column}>
                                      <div className='h-4 w-full max-w-48 bg-muted rounded animate-pulse' />
                                  </TableCell>
                              ))}
                          </div>
                      ))
                    : rows.map((row, index) => (
                          <TableRow key={index} columns={columns} row={row} />
                      ))}
            </div>
        </div>
    );
}
