import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {PortalHeaderActions} from './PortalHeaderActions';
import type {PlanRecommendations} from './PlanPdf';

interface PortalHeaderProps {
    avatarUrl: string;
    name: string;
    recommendations: PlanRecommendations;
}

export default function PortalHeader({
    avatarUrl,
    name,
    recommendations
}: PortalHeaderProps) {
    return (
        <div className='flex items-center justify-between'>
            <div className='relative flex items-center gap-3'>
                <Avatar className='h-12 w-12 border-2 border-border'>
                    <AvatarImage
                        src={avatarUrl || undefined}
                        alt={name}
                        className='h-full w-full object-cover'
                    />
                    <AvatarFallback className='bg-gradient-to-br from-[hsl(262,80%,60%)] to-[hsl(220,70%,55%)] text-lg font-semibold text-primary-foreground'>
                        {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className='text-sm text-muted-foreground'>
                        Bienvenido de nuevo,
                    </p>
                    <p className='font-semibold text-foreground'>{name}</p>
                </div>
            </div>

            <PortalHeaderActions recommendations={recommendations} />
        </div>
    );
}
