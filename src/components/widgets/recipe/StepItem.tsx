import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {motion} from 'framer-motion';
import {Trash2} from 'lucide-react';

interface Step {
    id: string;
    instruction: string;
}

export function StepItem({
    step,
    index,
    onUpdate,
    onRemove
}: {
    step: Step;
    index: number;
    onUpdate: (instruction: string) => void;
    onRemove: () => void;
}) {
    return (
        <motion.div
            initial={{opacity: 0, y: -10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, x: -20}}
            transition={{duration: 0.2}}
            className='group relative flex gap-3 p-4 rounded-xl bg-secondary/30 border border-border hover:border-primary/30 transition-colors'>
            <div className='flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0'>
                {index + 1}
            </div>

            <div className='flex-1'>
                <Textarea
                    value={step.instruction}
                    onChange={e => onUpdate(e.target.value)}
                    placeholder={`Describe el paso ${index + 1}...`}
                    className='min-h-[80px] bg-background/50 border-border resize-none'
                />
            </div>

            <Button
                variant='ghost'
                size='icon'
                onClick={onRemove}
                className='h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0'>
                <Trash2 className='h-4 w-4' />
            </Button>
        </motion.div>
    );
}
