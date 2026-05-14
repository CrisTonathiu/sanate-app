import Image from 'next/image';
import { LogoutButton } from './LogoutButton';

interface PortalHeaderProps {
    avatarUrl: string;
    name: string;
}

export default function PortalHeader({avatarUrl, name}: PortalHeaderProps) {
    return (
        <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-primary/50">
          <Image
            src={avatarUrl}
            alt={name}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Bienvenido de nuevo,</p>
          <p className="font-semibold text-foreground">{name}</p>
        </div>
      </div>
      
      <LogoutButton />
    </div>
    );
}