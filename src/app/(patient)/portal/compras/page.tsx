'use client';

import {useState} from 'react';
import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Download,
    ShoppingCart,
    Apple,
    Beef,
    Milk,
    Wheat,
    Fish,
    Carrot,
    Egg,
    LeafyGreen,
    Cherry,
    Package
} from 'lucide-react';
import Link from 'next/link';
import {pdf} from '@react-pdf/renderer';
import {ShoppingListPdf} from '@/components/widgets/patient-portal/ShoppingListPdf';

interface ShoppingItem {
    id: string;
    name: string;
    quantity: string;
    category: 'produce' | 'protein' | 'dairy' | 'grains' | 'other';
}

interface WeeklyList {
    id: string;
    weekNumber: number;
    dateRange: string;
    items: ShoppingItem[];
    isExpanded: boolean;
}

const mockWeeklyLists: WeeklyList[] = [
    {
        id: '1',
        weekNumber: 1,
        dateRange: '28 abr - 4 may',
        isExpanded: true,
        items: [
            {
                id: '1a',
                name: 'Espinaca',
                quantity: '2 bolsas',
                category: 'produce'
            },
            {
                id: '1b',
                name: 'Pechuga de Pollo',
                quantity: '700 g',
                category: 'protein'
            },
            {
                id: '1c',
                name: 'Yogur Griego',
                quantity: '900 g',
                category: 'dairy'
            },
            {
                id: '1d',
                name: 'Arroz Integral',
                quantity: '1 kg',
                category: 'grains'
            },
            {
                id: '1e',
                name: 'Filete de Salmón',
                quantity: '500 g',
                category: 'protein'
            },
            {
                id: '1f',
                name: 'Aguacates',
                quantity: '4 piezas',
                category: 'produce'
            },
            {id: '1g', name: 'Huevos', quantity: '1 docena', category: 'dairy'},
            {
                id: '1h',
                name: 'Arándanos',
                quantity: '2 tazas',
                category: 'produce'
            }
        ]
    },
    {
        id: '2',
        weekNumber: 2,
        dateRange: '5 may - 11 may',
        isExpanded: false,
        items: [
            {
                id: '2a',
                name: 'Brócoli',
                quantity: '3 cabezas',
                category: 'produce'
            },
            {
                id: '2b',
                name: 'Pavo Molido',
                quantity: '1 kg',
                category: 'protein'
            },
            {
                id: '2c',
                name: 'Leche de Almendra',
                quantity: '1.9 l',
                category: 'dairy'
            },
            {id: '2d', name: 'Quinua', quantity: '500 g', category: 'grains'},
            {
                id: '2e',
                name: 'Filetes de Atún',
                quantity: '500 g',
                category: 'protein'
            },
            {
                id: '2f',
                name: 'Batatas',
                quantity: '1.4 kg',
                category: 'produce'
            }
        ]
    },
    {
        id: '3',
        weekNumber: 3,
        dateRange: '12 may - 18 may',
        isExpanded: false,
        items: [
            {
                id: '3a',
                name: 'Col Rizada',
                quantity: '2 manojos',
                category: 'produce'
            },
            {
                id: '3b',
                name: 'Carne Magra',
                quantity: '700 g',
                category: 'protein'
            },
            {
                id: '3c',
                name: 'Requesón',
                quantity: '450 g',
                category: 'dairy'
            },
            {id: '3d', name: 'Avena', quantity: '1 kg', category: 'grains'},
            {
                id: '3e',
                name: 'Camarones',
                quantity: '500 g',
                category: 'protein'
            },
            {
                id: '3f',
                name: 'Pimientos',
                quantity: '6 piezas',
                category: 'produce'
            },
            {
                id: '3g',
                name: 'Fresas',
                quantity: '2 tazas',
                category: 'produce'
            }
        ]
    },
    {
        id: '4',
        weekNumber: 4,
        dateRange: '19 may - 25 may',
        isExpanded: false,
        items: [
            {
                id: '4a',
                name: 'Espárragos',
                quantity: '2 manojos',
                category: 'produce'
            },
            {
                id: '4b',
                name: 'Filete de Cerdo',
                quantity: '700 g',
                category: 'protein'
            },
            {
                id: '4c',
                name: 'Queso Feta',
                quantity: '225 g',
                category: 'dairy'
            },
            {
                id: '4d',
                name: 'Pasta Integral',
                quantity: '500 g',
                category: 'grains'
            },
            {
                id: '4e',
                name: 'Filete de Bacalao',
                quantity: '500 g',
                category: 'protein'
            },
            {
                id: '4f',
                name: 'Calabacín',
                quantity: '4 piezas',
                category: 'produce'
            }
        ]
    }
];

function getCategoryIcon(category: ShoppingItem['category']) {
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

export default function ShoppingListPage() {
    const [weeklyLists, setWeeklyLists] =
        useState<WeeklyList[]>(mockWeeklyLists);

    const toggleWeek = (weekId: string) => {
        setWeeklyLists(prev =>
            prev.map(week =>
                week.id === weekId
                    ? {...week, isExpanded: !week.isExpanded}
                    : week
            )
        );
    };

    const handleDownload = async (week: WeeklyList) => {
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

    return (
        <main className='mx-auto max-w-4xl min-h-screen bg-background p-4 md:p-6 lg:p-8 space-y-6'>
            {/* Back Button */}
            <Link
                href='/portal'
                className='mb-6 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                <ArrowLeft className='h-4 w-4' />
                Regresar al portal
            </Link>

            {/* Header */}
            <div className='mb-6'>
                <h1 className='text-2xl font-semibold text-foreground md:text-3xl'>
                    Lista de Compras
                </h1>
                <p className='mt-1 text-sm text-muted-foreground'>
                    Tus listas de compras del plan nutricional semanal
                </p>
            </div>

            {/* Stats Card */}
            <div className='mb-6 rounded-2xl bg-card p-5'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20'>
                            <ShoppingCart className='h-6 w-6 text-amber-400' />
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

            {/* Weekly Lists */}
            <div className='space-y-4'>
                {weeklyLists.map(week => (
                    <div
                        key={week.id}
                        className='overflow-hidden rounded-2xl bg-card'>
                        {/* Week Header */}
                        <div className='flex items-center justify-between p-4'>
                            <button
                                onClick={() => toggleWeek(week.id)}
                                className='flex flex-1 items-center gap-3'>
                                <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-lg font-semibold text-amber-400'>
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
                                className='ml-3 flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-amber-400'>
                                <Download className='h-3.5 w-3.5' />
                                <span className='hidden sm:inline'>
                                    Descargar
                                </span>
                            </button>
                        </div>

                        {/* Items List */}
                        {week.isExpanded && (
                            <div className='border-t border-border'>
                                <div className='grid gap-px bg-border sm:grid-cols-2'>
                                    {week.items.map(item => (
                                        <div
                                            key={item.id}
                                            className='flex items-center gap-3 bg-card p-3'>
                                            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-muted'>
                                                {getCategoryIcon(item.category)}
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

                                {/* Category Legend */}
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

            {/* Footer */}
            <p className='mt-6 text-center text-xs text-muted-foreground'>
                Las listas de compras se generan a partir de tu plan nutricional
            </p>
        </main>
    );
}
