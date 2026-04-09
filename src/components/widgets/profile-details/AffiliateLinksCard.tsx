'use client';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {AnimatePresence, motion} from 'framer-motion';
import {ExternalLink, Link2, Plus, Trash2} from 'lucide-react';
import {useState} from 'react';

interface AffiliateLink {
    id: string;
    name: string;
    url: string;
}

interface AffiliateLinksCardProps {
    links: AffiliateLink[];
    setLinks: (links: AffiliateLink[]) => void;
}

export function AffiliateLinksCard({links, setLinks}: AffiliateLinksCardProps) {
    const [editingId, setEditingId] = useState<string | null>(null);

    const addLink = () => {
        const newLink: AffiliateLink = {
            id: Date.now().toString(),
            name: '',
            url: ''
        };
        setLinks([...links, newLink]);
        setEditingId(newLink.id);
    };

    const updateLink = (
        id: string,
        field: keyof AffiliateLink,
        value: string
    ) => {
        setLinks(
            links.map(link =>
                link.id === id ? {...link, [field]: value} : link
            )
        );
    };

    const removeLink = (id: string) => {
        setLinks(links.filter(link => link.id !== id));
        if (editingId === id) setEditingId(null);
    };

    return (
        <Card>
            <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                    <CardTitle className='text-base flex items-center gap-2'>
                        <Link2 className='h-5 w-5 text-primary' />
                        Links de afiliados
                    </CardTitle>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={addLink}
                        className='h-8 text-xs'>
                        <Plus className='h-3.5 w-3.5 mr-1' />
                        Agregar link
                    </Button>
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                    Agrega links de afiliados para suplementos recomendados
                </p>
            </CardHeader>
            <CardContent className='space-y-3'>
                <AnimatePresence mode='popLayout'>
                    {links.map(link => (
                        <motion.div
                            key={link.id}
                            initial={{opacity: 0, height: 0}}
                            animate={{opacity: 1, height: 'auto'}}
                            exit={{opacity: 0, height: 0}}
                            className='p-3 rounded-lg border border-border bg-secondary/20 space-y-2'>
                            {/* Name Input */}
                            <div className='space-y-1'>
                                <Label className='text-xs text-muted-foreground'>
                                    Nombre del producto
                                </Label>
                                <Input
                                    value={link.name}
                                    onChange={e =>
                                        updateLink(
                                            link.id,
                                            'name',
                                            e.target.value
                                        )
                                    }
                                    placeholder='Ej. Suplemento de Vitamina D3'
                                    className='h-9 bg-background border-border text-sm'
                                />
                            </div>

                            {/* URL Input */}
                            <div className='space-y-1'>
                                <Label className='text-xs text-muted-foreground'>
                                    URL de afiliado
                                </Label>
                                <div className='relative flex gap-2'>
                                    <div className='relative flex-1'>
                                        <Link2 className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                                        <Input
                                            value={link.url}
                                            onChange={e =>
                                                updateLink(
                                                    link.id,
                                                    'url',
                                                    e.target.value
                                                )
                                            }
                                            placeholder='https://...'
                                            className='h-9 pl-9 bg-background border-border text-sm'
                                        />
                                    </div>
                                    {link.url && (
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            className='h-9 px-2.5'
                                            onClick={() =>
                                                window.open(link.url, '_blank')
                                            }
                                            title='Abrir link'>
                                            <ExternalLink className='h-4 w-4' />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className='flex justify-end pt-1'>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => removeLink(link.id)}
                                    className='h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10'>
                                    <Trash2 className='h-3.5 w-3.5 mr-1' />
                                    Eliminar
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {links.length === 0 && (
                    <div className='text-center py-6 text-muted-foreground'>
                        <Link2 className='h-8 w-8 mx-auto mb-2 opacity-50' />
                        <p className='text-sm'>No hay links de afiliados</p>
                        <p className='text-xs'>
                            Haz clic en &quot;Agregar link&quot; para añadir tu
                            primer link
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
