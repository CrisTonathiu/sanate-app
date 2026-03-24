import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {IngredientDTO} from '@/lib/dto/IngredientDTO';
import {AnimatePresence, motion} from 'framer-motion';
import {Trash2} from 'lucide-react';

const UNITS = [
    {value: 'g', label: 'gramos'},
    {value: 'piece', label: 'pieza'},
    {value: 'cup', label: 'taza'},
    {value: 'tbsp', label: 'cda'},
    {value: 'tsp', label: 'cdita'},
    {value: 'ml', label: 'ml'},
    {value: 'oz', label: 'oz'}
];

export function IngredientRow({
    ingredient,
    index,
    onUpdate,
    onRemove,
    showSuggestions,
    onFocus,
    onBlur,
    suggestions,
    onSelectSuggestion
}: {
    ingredient: IngredientDTO;
    index: number;
    onUpdate: (field: keyof IngredientDTO, value: string | number) => void;
    onRemove: () => void;
    showSuggestions: boolean;
    onFocus: () => void;
    onBlur: () => void;
    suggestions: string[];
    onSelectSuggestion: (name: string) => void;
}) {
    return (
        <motion.div
            initial={{opacity: 0, y: -10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, x: -20}}
            transition={{duration: 0.2}}
            className='group relative flex items-start gap-3 p-4 rounded-xl bg-secondary/30 border border-border hover:border-primary/30 transition-colors'>
            <div className='flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary text-sm font-semibold shrink-0 mt-1'>
                {index + 1}
            </div>

            <div className='flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3'>
                {/* Ingredient Name */}
                <div className='sm:col-span-5 relative'>
                    <Label className='text-xs text-muted-foreground mb-1.5 block'>
                        Ingrediente
                    </Label>
                    <Input
                        value={ingredient.name}
                        onChange={e => onUpdate('name', e.target.value)}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        placeholder='ej. Pechuga de Pollo'
                        className='h-10 bg-background/50 border-border'
                    />
                    {/* Autocomplete Suggestions */}
                    <AnimatePresence>
                        {showSuggestions && suggestions.length > 0 && (
                            <motion.div
                                initial={{opacity: 0, y: -5}}
                                animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: -5}}
                                className='absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden'>
                                {suggestions.slice(0, 5).map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onMouseDown={() =>
                                            onSelectSuggestion(suggestion)
                                        }
                                        className='w-full px-3 py-2 text-left text-sm hover:bg-secondary/50 transition-colors'>
                                        {suggestion}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Quantity */}
                <div className='sm:col-span-3'>
                    <Label className='text-xs text-muted-foreground mb-1.5 block'>
                        Cantidad
                    </Label>
                    <Input
                        type='number'
                        value={ingredient.quantity}
                        onChange={e =>
                            onUpdate(
                                'quantity',
                                e.target.value ? parseFloat(e.target.value) : ''
                            )
                        }
                        placeholder='100'
                        className='h-10 bg-background/50 border-border'
                    />
                </div>

                {/* Unit */}
                <div className='sm:col-span-4'>
                    <Label className='text-xs text-muted-foreground mb-1.5 block'>
                        Unidad
                    </Label>
                    <Select
                        value={ingredient.unit}
                        onValueChange={value => onUpdate('unit', value)}>
                        <SelectTrigger className='h-10 bg-background/50 border-border'>
                            <SelectValue placeholder='Seleccionar' />
                        </SelectTrigger>
                        <SelectContent>
                            {UNITS.map(unit => (
                                <SelectItem key={unit.value} value={unit.value}>
                                    {unit.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
