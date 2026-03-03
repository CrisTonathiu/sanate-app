import {motion} from 'framer-motion';
import {Label} from '../ui/label';

const itemVariants = {
    hidden: {opacity: 0, y: 10},
    visible: {opacity: 1, y: 0}
};

export default function FormField({
    label,
    icon,
    children
}: {
    label: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <motion.div variants={itemVariants} className='flex flex-col gap-2'>
            <Label className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
                {icon && (
                    <span className='text-muted-foreground/60'>{icon}</span>
                )}
                {label}
            </Label>
            {children}
        </motion.div>
    );
}
