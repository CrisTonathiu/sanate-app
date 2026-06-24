'use client';

import {useState} from 'react';
import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Download,
    ShoppingCart,
    Beef,
    Milk,
    Wheat,
    LeafyGreen,
    Package
} from 'lucide-react';
import Link from 'next/link';
import {pdf} from '@react-pdf/renderer';
import {ShoppingListPdf} from '@/components/widgets/patient-portal/ShoppingListPdf';
import type {
    ShoppingCategory,
    WeeklyShoppingList
} from '@/lib/patient-portal/shopping-list.types';

function getCategoryIcon(category: ShoppingCategory) {
    switch (category) {
        case 'produce':
            return <LeafyGreen className='h-4 w-4 text-green-400' />;
        case 'protein':
            return <Beef className='h-4 w-4 text-red-400' />;
        case 'dairy':
            return <Milk className='h-4 w-4 text-blue-400' />;
        case 'grains':
            return <Wheat className='h-4 w-4 text-amber-400' />;
        default:
            return <Package className='h-4 w-4 text-muted-foreground' />;
    }
}

type ShoppingListClientProps = {
    weeklyLists: WeeklyShoppingList[];
};

export default function ShoppingListClient({
    weeklyLists: initialWeeklyLists
}: ShoppingListClientProps) {
    const [weeklyLists, setWeeklyLists] =
        useState<WeeklyShoppingList[]>(initialWeeklyLists);

    const toggleWeek = (weekId: string) => {
        setWeeklyLists(prev =>
            prev.map(week =>
                week.id === weekId
                    ? {...week, isExpanded: !week.isExpanded}
                    : week
            )
        );
    };

    const handleDownload = async (week: WeeklyShoppingList) => {
        const blob = await pdf(<ShoppingListPdf week={week} />).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lista-compras-semana-${week.weekNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalItems = weeklyLists.reduce(
        (acc, week) => acc + week.items.length,
        0
    );

    if (weeklyLists.length === 0) {
        return (
            <main className='mx-auto max-w-4xl min-h-screen bg-background p-4 md:p-6 lg:p-8 space-y-6'>
                <Link
                    href='/portal'
                    className='mb-6 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                    <ArrowLeft className='h-4 w-4' />
                    Regresar al portal
                </Link>

                <div className='rounded-2xl bg-card p-8 text-center'>
                    <p className='text-lg font-medium text-foreground'>
                        No hay lista de compras disponible
                    </p>
                    <p className='mt-2 text-sm text-muted-foreground'>
                        Tu nutriólogo aún no ha asignado un plan nutricional
                        activo.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className='mx-auto max-w-4xl min-h-screen bg-background p-4 md:p-6 lg:p-8 space-y-6'>
            <Link
                href='/portal'
                className='mb-6 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                <ArrowLeft className='h-4 w-4' />
                Regresar al portal
            </Link>

            <div className='mb-6'>
                <h1 className='text-2xl font-semibold text-foreground md:text-3xl'>
                    Lista de Compras
                </h1>
                <p className='mt-1 text-sm text-muted-foreground'>
                    Tus listas de compras del plan nutricional semanal
                </p>
            </div>

            <div className='mb-6 rounded-2xl bg-card p-5'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20'>
                            <ShoppingCart className='h-6 w-6 text-accent-foreground' />
                        </div>
                        <div>
                            <p className='text-2xl font-semibold text-foreground'>
                                {weeklyLists.length}
                            </p>
                            <p className='text-sm text-muted-foreground'>
                                Listas Semanales
                            </p>
                        </div>
                    </div>
                    <div className='text-right'>
                        <p className='text-2xl font-semibold text-foreground'>
                            {totalItems}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                            Total de Artículos
                        </p>
                    </div>
                </div>
            </div>

            <div className='space-y-4'>
                {weeklyLists.map(week => (
                    <div
                        key={week.id}
                        className='overflow-hidden rounded-2xl bg-card'>
                        <div className='flex items-center justify-between p-4'>
                            <button
                                onClick={() => toggleWeek(week.id)}
                                className='flex flex-1 items-center gap-3'>
                                <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-lg font-semibold text-accent-foreground'>
                                    {week.weekNumber}
                                </div>
                                <div className='text-left'>
                                    <p className='text-sm font-medium text-foreground'>
                                        Semana {week.weekNumber}
                                    </p>
                                    <p className='text-xs text-muted-foreground'>
                                        {week.dateRange}
                                    </p>
                                </div>
                                <div className='ml-auto flex items-center gap-2 text-muted-foreground'>
                                    <span className='text-xs'>
                                        {week.items.length} artículos
                                    </span>
                                    {week.isExpanded ? (
                                        <ChevronUp className='h-4 w-4' />
                                    ) : (
                                        <ChevronDown className='h-4 w-4' />
                                    )}
                                </div>
                            </button>
                            <button
                                onClick={() => handleDownload(week)}
                                disabled={week.items.length === 0}
                                className='ml-3 flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50'>
                                <Download className='h-3.5 w-3.5' />
                                <span className='hidden sm:inline'>
                                    Descargar
                                </span>
                            </button>
                        </div>

                        {week.isExpanded && (
                            <div className='border-t border-border'>
                                {week.items.length === 0 ? (
                                    <p className='p-4 text-sm text-muted-foreground'>
                                        No hay ingredientes para esta semana.
                                    </p>
                                ) : (
                                    <div className='grid gap-px bg-border sm:grid-cols-2'>
                                        {week.items.map(item => (
                                            <div
                                                key={item.id}
                                                className='flex items-center gap-3 bg-card p-3'>
                                                <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-muted'>
                                                    {getCategoryIcon(
                                                        item.category
                                                    )}
                                                </div>
                                                <div className='flex-1 min-w-0'>
                                                    <p className='truncate text-sm font-medium text-foreground'>
                                                        {item.name}
                                                    </p>
                                                    <p className='text-xs text-muted-foreground'>
                                                        {item.quantity}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className='flex flex-wrap items-center gap-4 border-t border-border p-3'>
                                    <div className='flex items-center gap-1.5'>
                                        <LeafyGreen className='h-3 w-3 text-green-400' />
                                        <span className='text-xs text-muted-foreground'>
                                            Productos
                                        </span>
                                    </div>
                                    <div className='flex items-center gap-1.5'>
                                        <Beef className='h-3 w-3 text-red-400' />
                                        <span className='text-xs text-muted-foreground'>
                                            Proteína
                                        </span>
                                    </div>
                                    <div className='flex items-center gap-1.5'>
                                        <Milk className='h-3 w-3 text-blue-400' />
                                        <span className='text-xs text-muted-foreground'>
                                            Lácteos
                                        </span>
                                    </div>
                                    <div className='flex items-center gap-1.5'>
                                        <Wheat className='h-3 w-3 text-amber-400' />
                                        <span className='text-xs text-muted-foreground'>
                                            Cereales
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <p className='mt-6 text-center text-xs text-muted-foreground'>
                Cantidades adaptadas para comprar en México a partir de tu plan
                nutricional.
            </p>
        </main>
    );
}
