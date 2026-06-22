'use client';

import {useState} from 'react';
import {ChevronDown} from 'lucide-react';
import {cn} from '@/lib/utils';
import {ScrollArea} from '../ui/scroll-area';
import {Badge} from '../ui/badge';
import {usePrefetchFoods} from '@/hooks/use-foods';
import {sidebarItems} from './sidebar-items';

type SidebarNavProps = {
    onNavigate?: () => void;
};

export function SidebarNav({onNavigate}: SidebarNavProps) {
    const prefetchFoods = usePrefetchFoods();
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
        {}
    );

    const toggleExpanded = (title: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const prefetchIfNeeded = (url: string) => {
        if (url === '/recetas/nuevo' || url === '/alimentos/nuevo') {
            prefetchFoods();
        }
    };

    return (
        <ScrollArea className='flex-1 px-3 py-2'>
            <div className='space-y-1'>
                {sidebarItems.map(item => (
                    <div key={item.title} className='mb-1'>
                        {item.url && !item.items ? (
                            <a
                                href={item.url}
                                onClick={onNavigate}
                                className={cn(
                                    'flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium',
                                    item.isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'hover:bg-muted'
                                )}>
                                <div className='flex items-center gap-3'>
                                    {item.icon}
                                    <span>{item.title}</span>
                                </div>
                            </a>
                        ) : (
                            <button
                                type='button'
                                className={cn(
                                    'flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium',
                                    item.isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'hover:bg-muted'
                                )}
                                onClick={() =>
                                    item.items && toggleExpanded(item.title)
                                }>
                                <div className='flex items-center gap-3'>
                                    {item.icon}
                                    <span>{item.title}</span>
                                </div>
                                {item.items && (
                                    <ChevronDown
                                        className={cn(
                                            'ml-2 h-4 w-4 transition-transform',
                                            expandedItems[item.title]
                                                ? 'rotate-180'
                                                : ''
                                        )}
                                    />
                                )}
                            </button>
                        )}

                        {item.items && expandedItems[item.title] && (
                            <div className='mt-1 ml-6 space-y-1 border-l pl-3'>
                                {item.items.map(subItem => (
                                    <a
                                        key={subItem.title}
                                        href={subItem.url}
                                        onClick={onNavigate}
                                        onMouseEnter={() =>
                                            prefetchIfNeeded(subItem.url)
                                        }
                                        onFocus={() =>
                                            prefetchIfNeeded(subItem.url)
                                        }
                                        className='flex items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-muted'>
                                        {subItem.title}
                                        {subItem.badge && (
                                            <Badge
                                                variant='outline'
                                                className='ml-auto rounded-full px-2 py-0.5 text-xs'>
                                                {subItem.badge}
                                            </Badge>
                                        )}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
