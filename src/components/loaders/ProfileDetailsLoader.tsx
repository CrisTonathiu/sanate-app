import {motion} from 'framer-motion';

export default function ProfileDetailsLoader() {
    return (
        <div className='relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
            {/* Breadcrumb Skeleton */}
            <motion.nav
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.4}}
                className='mb-6 flex items-center gap-2 text-sm'>
                <div className='h-4 w-32 animate-pulse rounded bg-muted' />
                <div className='h-3.5 w-3.5 animate-pulse rounded bg-muted' />
                <div className='h-4 w-40 animate-pulse rounded bg-muted' />
            </motion.nav>

            {/* Patient Header Skeleton */}
            <motion.div
                initial={{opacity: 0, y: 15}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.1}}
                className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-4'>
                    <div className='h-16 w-16 animate-pulse rounded-full bg-muted' />
                    <div className='flex flex-col gap-2'>
                        <div className='h-6 w-48 animate-pulse rounded bg-muted' />
                        <div className='h-4 w-64 animate-pulse rounded bg-muted' />
                    </div>
                </div>

                {/* Action Buttons Skeleton */}
                <div className='flex items-center gap-2'>
                    <div className='h-10 w-40 animate-pulse rounded-xl bg-muted' />
                    <div className='h-10 w-10 animate-pulse rounded-xl bg-muted' />
                </div>
            </motion.div>

            {/* Tabs Skeleton */}
            <motion.div
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.4, delay: 0.2}}
                className='mb-8'>
                <div className='flex gap-4 border-b border-border pb-4'>
                    <div className='h-4 w-40 animate-pulse rounded bg-muted' />
                    <div className='h-4 w-40 animate-pulse rounded bg-muted' />
                    <div className='h-4 w-32 animate-pulse rounded bg-muted' />
                </div>
            </motion.div>

            {/* Content Skeleton */}
            <div className='space-y-4'>
                <div className='h-4 w-full animate-pulse rounded bg-muted' />
                <div className='h-4 w-full animate-pulse rounded bg-muted' />
                <div className='h-4 w-3/4 animate-pulse rounded bg-muted' />
            </div>
        </div>
    );
}
