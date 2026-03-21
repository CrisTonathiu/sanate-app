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
            className='group relative flex items-start gap-3 p-4 rounded-xl border transition-colors bg-secondary/20 border-border hover:border-muted-foreground/30'>
            <div className='flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 text-muted-foreground text-sm font-semibold shrink-0 mt-1'>
                {index + 1}
            </div>

            <div className='flex-1 space-y-3'>
                <div className='grid gap-3 grid-cols-1'>
                    {/* Ingredient Name */}
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

            <Button
                variant='ghost'
                size='icon'
                onClick={onRemove}
                className='h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 mt-6'>
                <Trash2 className='h-4 w-4' />
            </Button>
        </motion.div>
    );
}
