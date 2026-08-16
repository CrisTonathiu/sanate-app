'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {IngredientGroupPill} from '@/components/widgets/food/IngredientGroupPill';
import {useGetIngredientGroups} from '@/hooks/use-foods';
import {motion} from 'framer-motion';
import {Layers, Pencil, Plus, Search} from 'lucide-react';
import Link from 'next/link';
import {useMemo, useState} from 'react';

export default function ClientPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const {data: groups = [], isPending} = useGetIngredientGroups();

    const filteredGroups = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return groups;

        return groups.filter(group => {
            const memberNames = group.items
                .map(item => item.food?.name?.toLowerCase() ?? '')
                .join(' ');
            return (
                group.name.toLowerCase().includes(q) || memberNames.includes(q)
            );
        });
    }, [groups, searchQuery]);

    return (
        <div className='relative w-full md:w-auto mt-3 md:mt-0'>
            <motion.div
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className='mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                            Grupos
                        </h1>
                        <p className='text-sm text-muted-foreground mt-1'>
                            Agrupa alimentos relacionados para excluirlos juntos
                            en los menús
                        </p>
                    </div>
                    <Button
                        asChild
                        className='h-11 px-5 rounded-xl font-medium shadow-lg shadow-primary/25'>
                        <Link href='/alimentos/grupos/nuevo'>
                            <Plus className='h-4 w-4 mr-2' />
                            Crear grupo
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
                        placeholder='Buscar por nombre o alimento...'
                        className='h-11 pl-10 bg-card/50 border-border rounded-xl'
                    />
                </div>

                <p className='text-sm text-muted-foreground'>
                    {isPending ? 'Cargando grupos...' : 'Mostrando'}{' '}
                    <span className='font-medium text-foreground'>
                        {filteredGroups.length}
                    </span>{' '}
                    grupos
                </p>

                <div className='rounded-2xl border border-border bg-card/50 overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='border-b border-border bg-muted/30 text-left'>
                                    <th className='px-4 py-3 font-medium'>
                                        Grupo
                                    </th>
                                    <th className='px-4 py-3 font-medium'>
                                        Alimentos
                                    </th>
                                    <th className='px-4 py-3 font-medium text-right'>
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGroups.length > 0 ? (
                                    filteredGroups.map(group => {
                                        const memberNames = group.items
                                            .map(item => item.food?.name)
                                            .filter(Boolean);
                                        const preview = memberNames.slice(0, 4);
                                        const extra =
                                            memberNames.length - preview.length;

                                        return (
                                            <tr
                                                key={group.id}
                                                className='border-b border-border/60 last:border-0 hover:bg-muted/20'>
                                                <td className='px-4 py-3'>
                                                    <IngredientGroupPill
                                                        name={group.name}
                                                        color={group.color}
                                                    />
                                                </td>
                                                <td className='px-4 py-3 text-muted-foreground'>
                                                    {memberNames.length > 0 ? (
                                                        <span>
                                                            {preview.join(', ')}
                                                            {extra > 0
                                                                ? ` +${extra}`
                                                                : ''}
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className='px-4 py-3 text-right'>
                                                    <Button
                                                        asChild
                                                        size='sm'
                                                        variant='outline'>
                                                        <Link
                                                            href={`/alimentos/grupos/${group.id}/editar`}>
                                                            <Pencil className='h-3.5 w-3.5 mr-1.5' />
                                                            Editar
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className='px-4 py-12 text-center text-muted-foreground'>
                                            <div className='flex flex-col items-center gap-3'>
                                                <Layers className='h-8 w-8 opacity-40' />
                                                <p>
                                                    {isPending
                                                        ? 'Cargando...'
                                                        : 'No hay grupos que coincidan con la búsqueda'}
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
