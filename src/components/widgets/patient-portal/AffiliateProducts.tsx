'use client';

import type {AffiliateLink} from '@/components/widgets/profile-details/AffiliateLinksCard';
import {ExternalLink} from 'lucide-react';

type AffiliateProductsProps = {
    affiliateLinks: AffiliateLink[];
};

export function AffiliateProducts({affiliateLinks}: AffiliateProductsProps) {
    if (affiliateLinks.length === 0) {
        return null;
    }

    return (
        <section className='mt-8'>
            <div className='mb-4 flex items-center justify-between'>
                <div>
                    <h2 className='text-lg font-semibold text-foreground'>
                        Productos recomendados
                    </h2>
                    <p className='text-sm text-muted-foreground'>
                        Suplementos y productos sugeridos por tu nutriólogo
                    </p>
                </div>
            </div>

            <div className='flex gap-4 overflow-x-auto pb-4 scrollbar-hide'>
                {affiliateLinks.map(link => (
                    <a
                        key={link.id}
                        href={link.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='group flex-shrink-0 w-60 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-md'>
                        <h3 className='text-sm font-medium text-card-foreground line-clamp-2'>
                            {link.name}
                        </h3>
                        <div className='mt-2 flex items-center justify-end'>
                            <ExternalLink className='h-3.5 w-3.5 text-muted-foreground group-hover:text-primary' />
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}
