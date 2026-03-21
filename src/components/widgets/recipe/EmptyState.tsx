export function EmptyState({
    title,
    description,
    icon: Icon
}: {
    title: string;
    description: string;
    icon: React.ElementType;
}) {
    return (
        <div className='flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-dashed border-border bg-secondary/10'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50 mb-3'>
                <Icon className='h-6 w-6 text-muted-foreground' />
            </div>
            <p className='text-sm font-medium text-foreground mb-1'>{title}</p>
            <p className='text-xs text-muted-foreground text-center'>
                {description}
            </p>
        </div>
    );
}
