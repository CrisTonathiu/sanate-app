import {motion} from 'framer-motion';

export default function SectionHeading({
    title,
    subtitle,
    delay = 0
}: {
    title: string;
    subtitle?: string;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{opacity: 0, x: -10}}
            animate={{opacity: 1, x: 0}}
            transition={{delay, duration: 0.4}}
            className='flex items-center gap-3'>
            <div className='h-6 w-1 rounded-full bg-gradient-to-b from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)]' />
            <h3 className='text-sm font-bold uppercase tracking-wider text-foreground'>
                {title}
            </h3>
            {subtitle && (
                <span className='text-xs text-muted-foreground'>
                    {subtitle}
                </span>
            )}
        </motion.div>
    );
}
