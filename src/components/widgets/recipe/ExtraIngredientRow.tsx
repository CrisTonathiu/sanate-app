import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {ExtraIngredientDTO} from '@/lib/dto/IngredientDTO';
import {motion} from 'framer-motion';
import {Trash2} from 'lucide-react';

export function ExtraIngredientRow({
    ingredient,
    index,
    onUpdate,
    onRemove
}: {
    ingredient: ExtraIngredientDTO;
    index: number;
    onUpdate: (
        field: keyof ExtraIngredientDTO,
        value: string | number | boolean
    ) => void;
    onRemove: () => void;
}) {
    return (
        <motion.div
            initial={{opacity: 0, y: -10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, x: -20}}
            transition={{duration: 0.2}}
            className='group relative flex flex-col gap-3 p-3 rounded-xl border transition-colors bg-secondary/20 border-border hover:border-muted-foreground/30 sm:flex-row sm:items-start sm:gap-3 sm:p-4'>
            <div className='flex items-center justify-between sm:contents'>
                <div className='flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 text-muted-foreground text-sm font-semibold shrink-0 sm:order-1'>
                    {index + 1}
                </div>

                <Button
                    variant='ghost'
                    size='icon'
                    onClick={onRemove}
                    className='h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 sm:order-3'>
                    <Trash2 className='h-4 w-4' />
                </Button>
            </div>

            <div className='flex-1 min-w-0 w-full sm:order-2'>
                <div>
                    <Label className='text-xs text-muted-foreground mb-1.5 block'>
                        Ingrediente
                    </Label>
                    <Input
                        value={ingredient.name}
                        onChange={e => onUpdate('name', e.target.value)}
                        placeholder='ej. Sal, pimienta, cilantro...'
                        className='h-10 bg-background/50 border-border'
                    />
                </div>
            </div>
        </motion.div>
    );
}
