'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {useGetFoods} from '@/hooks/use-foods';
import {motion} from 'framer-motion';
import {Apple, Pencil, Plus, Search} from 'lucide-react';
import Link from 'next/link';
import {useMemo, useState} from 'react';

export default function ClientPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const {data: foods = [], isPending} = useGetFoods();

    const filteredFoods = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return foods;

        return foods.filter(food => {
            const groupName = food.group?.name?.toLowerCase() ?? '';
            return (
                food.name.toLowerCase().includes(q) || groupName.includes(q)
            );
        });
    }, [foods, searchQuery]);

    return (
        <div className='relative w-full md:w-auto mt-3 md:mt-0'>
            <motion.div
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className='mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                            Alimentos
                        </h1>
                        <p className='text-sm text-muted-foreground mt-1'>
                            Catálogo de alimentos para recetas y protocolos
                        </p>
                    </div>
                    <Button
                        asChild
                        className='h-11 px-5 rounded-xl font-medium shadow-lg shadow-primary/25'>
                        <Link href='/alimentos/nuevo'>
                            <Plus className='h-4 w-4 mr-2' />
                            Agregar alimento
                        </Link>
                    </Button>
                </div>
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.1}}
                className='space-y-4'>
                <div className='relative max-w-md'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder='Buscar por nombre o grupo...'
                        className='h-11 pl-10 bg-card/50 border-border rounded-xl'
                    />
                </div>

                <p className='text-sm text-muted-foreground'>
                    {isPending ? 'Cargando alimentos...' : 'Mostrando'}{' '}
                    <span className='font-medium text-foreground'>
                        {filteredFoods.length}
                    </span>{' '}
                    alimentos
                </p>

                <div className='rounded-2xl border border-border bg-card/50 overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='border-b border-border bg-muted/30 text-left'>
                                    <th className='px-4 py-3 font-medium'>
                                        Nombre
                                    </th>
                                    <th className='px-4 py-3 font-medium'>
                                        Grupo
                                    </th>
                                    <th className='px-4 py-3 font-medium'>
                                        kcal / 100g
                                    </th>
                                    <th className='px-4 py-3 font-medium'>
                                        Densidad
                                    </th>
                                    <th className='px-4 py-3 font-medium text-right'>
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFoods.length > 0 ? (
                                    filteredFoods.map(food => (
                                        <tr
                                            key={food.id}
                                            className='border-b border-border/60 last:border-0 hover:bg-muted/20'>
                                            <td className='px-4 py-3 font-medium'>
                                                {food.name}
                                            </td>
                                            <td className='px-4 py-3 text-muted-foreground'>
                                                {food.group?.name ?? '—'}
                                            </td>
                                            <td className='px-4 py-3'>
                                                {food.caloriesPer100g != null
                                                    ? Math.round(
                                                          food.caloriesPer100g
                                                      )
                                                    : '—'}
                                            </td>
                                            <td className='px-4 py-3 text-muted-foreground'>
                                                {food.density != null
                                                    ? food.density.toFixed(3)
                                                    : '—'}
                                            </td>
                                            <td className='px-4 py-3 text-right'>
                                                <Button
                                                    asChild
                                                    size='sm'
                                                    variant='outline'>
                                                    <Link
                                                        href={`/alimentos/${food.id}/editar`}>
                                                        <Pencil className='h-3.5 w-3.5 mr-1.5' />
                                                        Editar
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className='px-4 py-12 text-center text-muted-foreground'>
                                            <div className='flex flex-col items-center gap-3'>
                                                <Apple className='h-8 w-8 opacity-40' />
                                                <p>
                                                    {isPending
                                                        ? 'Cargando...'
                                                        : 'No hay alimentos que coincidan con la búsqueda'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
