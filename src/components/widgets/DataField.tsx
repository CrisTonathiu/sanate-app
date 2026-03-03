import {PatientField} from '@/lib/interface/patient-field-interface';
import {motion} from 'framer-motion';

export default function DataField({
    field,
    index,
    delay = 0
}: {
    field: PatientField;
    index: number;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: delay + index * 0.05, duration: 0.3}}
            className='group flex flex-col gap-1.5 rounded-xl p-3 transition-colors duration-200 hover:bg-secondary/40'>
            <span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                {field.icon && (
                    <span className='text-muted-foreground/60'>
                        {field.icon}
                    </span>
                )}
                {field.label}
            </span>
            <span className='text-sm font-medium text-foreground'>
                {field.value}
            </span>
        </motion.div>
    );
}
