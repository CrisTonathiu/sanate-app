import Image from 'next/image';
import {X} from 'lucide-react';
import {Button} from '../ui/button';

type SidebarBrandProps = {
    onClose?: () => void;
};

export function SidebarBrand({onClose}: SidebarBrandProps) {
    return (
        <div className='flex items-center justify-between p-4'>
            <div className='flex items-center gap-3'>
                <div className='relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl'>
                    <Image
                        src='/LOGO_ZANATE_FUNTIONAL.png'
                        alt='Zanate'
                        width={48}
                        height={48}
                        className='size-12 object-contain'
                    />
                </div>
                <div>
                    <h2 className='font-semibold'>Zanate</h2>
                    <p className='text-xs text-muted-foreground'>
                        Gestion Nutricional
                    </p>
                </div>
            </div>
            {onClose && (
                <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='rounded-2xl'
                    onClick={onClose}>
                    <X className='h-5 w-5' />
                    <span className='sr-only'>Cerrar menu</span>
                </Button>
            )}
        </div>
    );
}
