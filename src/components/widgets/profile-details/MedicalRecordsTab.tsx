import {motion} from 'framer-motion';
import {FileText} from 'lucide-react';
import SectionHeading from '../SectionHeading';
import {Badge} from '@/components/ui/badge';

export default function MedicalRecordsTab() {
    const RECORDS = [
        {
            name: 'Resultados de Electrocardiograma',
            date: '12 Junio 2025',
            type: 'Imagen',
            size: '2.3 MB'
        },
        {
            name: 'Resultados de Análisis de Sangre',
            date: '5 Mayo 2025',
            type: 'PDF',
            size: '1.1 MB'
        }
    ];
    return (
        <motion.div
            key='records'
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -12}}
            transition={{duration: 0.35}}
            className='flex flex-col gap-4'>
            <SectionHeading title='Historial médico' delay={0.1} />
            <div className='flex flex-col gap-3'>
                {RECORDS.map((rec, i) => (
                    <motion.div
                        key={rec.name}
                        initial={{opacity: 0, y: 10}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.1 + i * 0.06, duration: 0.3}}
                        className='group flex items-center justify-between rounded-xl border border-border bg-card/50 p-4 transition-colors duration-200 hover:bg-secondary/30'>
                        <div className='flex items-center gap-4'>
                            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(262,80%,60%)/0.15] to-[hsl(220,70%,55%)/0.15]'>
                                <FileText className='h-4 w-4 text-primary' />
                            </div>
                            <div className='flex flex-col gap-0.5'>
                                <span className='text-sm font-medium text-foreground'>
                                    {rec.name}
                                </span>
                                <span className='text-xs text-muted-foreground'>
                                    {rec.date}
                                </span>
                            </div>
                        </div>
                        <div className='flex items-center gap-3'>
                            <Badge
                                variant='outline'
                                className='hidden text-xs sm:inline-flex'>
                                {rec.type}
                            </Badge>
                            <span className='text-xs text-muted-foreground'>
                                {rec.size}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
