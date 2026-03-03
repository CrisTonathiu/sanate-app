import {motion} from 'framer-motion';
import SectionHeading from '../SectionHeading';
import {Calendar, Clock} from 'lucide-react';
import {Badge} from '@/components/ui/badge';

export default function AppointmentHistoryTab() {
    const APPOINTMENTS = [
        {
            type: 'Consulta general',
            doctor: 'Lic. Cynthia Cervera',
            date: '12 Junio 2025',
            time: '10:00 AM',
            status: 'Completada'
        },
        {
            type: 'Consulta general',
            doctor: 'Lic. Cynthia Cervera',
            date: '5 Mayo 2025',
            time: '2:30 PM',
            status: 'Completada'
        }
    ];
    return (
        <motion.div
            key='appointments'
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -12}}
            transition={{duration: 0.35}}
            className='flex flex-col gap-4'>
            <SectionHeading title='Historial de consultas' delay={0.1} />
            <div className='flex flex-col gap-3'>
                {APPOINTMENTS.map((apt, i) => (
                    <motion.div
                        key={apt.date + apt.type}
                        initial={{opacity: 0, y: 10}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.1 + i * 0.06, duration: 0.3}}
                        className='group flex items-center justify-between rounded-xl border border-border bg-card/50 p-4 transition-colors duration-200 hover:bg-secondary/30'>
                        <div className='flex items-center gap-4'>
                            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(262,80%,60%)/0.15] to-[hsl(220,70%,55%)/0.15]'>
                                <Calendar className='h-4 w-4 text-primary' />
                            </div>
                            <div className='flex flex-col gap-0.5'>
                                <span className='text-sm font-medium text-foreground'>
                                    {apt.type}
                                </span>
                                <span className='text-xs text-muted-foreground'>
                                    {apt.doctor}
                                </span>
                            </div>
                        </div>
                        <div className='flex items-center gap-4'>
                            <div className='hidden flex-col items-end gap-0.5 sm:flex'>
                                <span className='text-xs text-foreground'>
                                    {apt.date}
                                </span>
                                <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                                    <Clock className='h-3 w-3' />
                                    {apt.time}
                                </span>
                            </div>
                            <Badge
                                variant='secondary'
                                className='border-none bg-[hsl(150,60%,40%)/0.15] text-[hsl(150,60%,50%)]'>
                                {apt.status}
                            </Badge>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
