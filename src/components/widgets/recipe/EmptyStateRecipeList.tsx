import {motion} from 'framer-motion';
import {Search} from 'lucide-react';

export function EmptyStateRecipeList() {
    return (
        <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            className='col-span-full flex flex-col items-center justify-center py-16 px-4'>
            <div className='flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50 mb-4'>
                <Search className='h-8 w-8 text-muted-foreground/50' />
            </div>
            <h3 className='text-lg font-semibold text-foreground mb-1'>
                Ninguna receta encontrada
            </h3>
            <p className='text-sm text-muted-foreground text-center max-w-sm'>
                Intenta ajustar tu búsqueda o filtro para encontrar lo que
                buscas.
            </p>
        </motion.div>
    );
}
