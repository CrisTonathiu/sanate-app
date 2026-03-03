import {motion} from 'framer-motion';
import SectionHeading from '../SectionHeading';
import {Badge, Calendar, Clock} from 'lucide-react';
import {Separator} from '@/components/ui/separator';

export default function NextTreatmentTab() {
    const TREATMENTS = [
        {
            name: 'Root Canal Therapy',
            doctor: 'Dr. Smith',
            date: 'June 20, 2025',
            time: '10:00 AM',
            notes: 'Patient has a deep cavity that requires root canal treatment. Ensure to use local anesthesia and provide post-treatment care instructions.'
        },
        {
            name: 'Dental Crown Placement',
            doctor: 'Dr. Johnson',
            date: 'June 25, 2025',
            time: '2:00 PM',
            notes: 'Patient needs a dental crown for the molar treated with root canal therapy. Prepare the tooth and take impressions for the crown fabrication.'
        }
    ];
    return (
        <motion.div
            key='treatments'
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -12}}
            transition={{duration: 0.35}}
            className='flex flex-col gap-4'>
            <SectionHeading title='Upcoming Treatments' delay={0.1} />
            <div className='flex flex-col gap-4'>
                {TREATMENTS.map((tx, i) => (
                    <motion.div
                        key={tx.name}
                        initial={{opacity: 0, y: 10}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.1 + i * 0.08, duration: 0.3}}
                        className='rounded-xl border border-border bg-card/50 p-5 transition-colors duration-200 hover:bg-secondary/30'>
                        <div className='flex items-start justify-between'>
                            <div className='flex flex-col gap-1'>
                                <h4 className='text-sm font-semibold text-foreground'>
                                    {tx.name}
                                </h4>
                                <span className='text-xs text-muted-foreground'>
                                    {tx.doctor}
                                </span>
                            </div>
                            <Badge className='border-none bg-[hsl(262,80%,60%)/0.15] text-primary'>
                                Scheduled
                            </Badge>
                        </div>
                        <Separator className='my-3 bg-border/50' />
                        <div className='flex flex-wrap items-center gap-4 text-xs text-muted-foreground'>
                            <span className='flex items-center gap-1.5'>
                                <Calendar className='h-3.5 w-3.5' />
                                {tx.date}
                            </span>
                            <span className='flex items-center gap-1.5'>
                                <Clock className='h-3.5 w-3.5' />
                                {tx.time}
                            </span>
                        </div>
                        <p className='mt-3 text-xs leading-relaxed text-muted-foreground'>
                            {tx.notes}
                        </p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
