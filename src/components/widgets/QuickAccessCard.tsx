'use client';

import {Button} from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {motion} from 'framer-motion';
import {Star} from 'lucide-react';

export interface QuickAccessAction {
    label: string;
    href?: string;
    description: string;
    icon: React.ReactNode;
    cta: string;
    onClick?: () => void;
}

interface QuickAccessCardProps {
    actions: QuickAccessAction[];
    title?: string;
}

export default function QuickAccessCard({
    actions,
    title = 'Acceso Rápido'
}: QuickAccessCardProps) {
    return (
        <section className='space-y-4'>
            <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-semibold'>{title}</h2>
            </div>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
                {actions.map(action => (
                    <motion.div
                        key={action.label}
                        whileHover={{scale: 1.02, y: -5}}
                        whileTap={{scale: 0.98}}>
                        <Card className='overflow-hidden rounded-3xl border-2 hover:border-primary/50 transition-all duration-300'>
                            <CardHeader className='pb-2'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-muted'>
                                        {action.icon}
                                    </div>
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        className='h-8 w-8 rounded-2xl'>
                                        <Star className='h-4 w-4' />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className='pb-2'>
                                <CardTitle className='text-lg'>
                                    {action.label}
                                </CardTitle>
                                <CardDescription>
                                    {action.description}
                                </CardDescription>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    variant='secondary'
                                    className='w-full rounded-2xl cursor-pointer'
                                    onClick={() => {
                                        if (action.onClick) {
                                            action.onClick();
                                        } else if (action.href) {
                                            window.location.href = action.href;
                                        }
                                    }}>
                                    {action.cta}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
