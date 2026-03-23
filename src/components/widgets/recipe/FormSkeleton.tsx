import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';

export function FormSkeleton() {
    return (
        <div className='min-h-screen bg-background'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8'>
                {/* Header Skeleton */}
                <div className='mb-8'>
                    <Skeleton className='h-4 w-32 mb-4' />
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                        <div>
                            <Skeleton className='h-8 w-48 mb-2' />
                            <Skeleton className='h-4 w-64' />
                        </div>
                        <div className='flex items-center gap-3'>
                            <Skeleton className='h-10 w-24' />
                            <Skeleton className='h-10 w-32' />
                        </div>
                    </div>
                </div>

                {/* Content Skeleton */}
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-2 space-y-6'>
                        {/* Basic Info Skeleton */}
                        <Card className='border-border bg-card/50'>
                            <CardHeader className='pb-3 border-b border-border'>
                                <Skeleton className='h-6 w-40' />
                            </CardHeader>
                            <CardContent className='pt-5 space-y-4'>
                                <div>
                                    <Skeleton className='h-4 w-24 mb-2' />
                                    <Skeleton className='h-11 w-full' />
                                </div>
                                <div>
                                    <Skeleton className='h-4 w-24 mb-2' />
                                    <Skeleton className='h-24 w-full' />
                                </div>
                                <div>
                                    <Skeleton className='h-4 w-24 mb-2' />
                                    <Skeleton className='h-11 w-full' />
                                </div>
                                <div>
                                    <Skeleton className='h-4 w-24 mb-2' />
                                    <Skeleton className='h-48 w-full' />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ingredients Skeleton */}
                        <Card className='border-border bg-card/50'>
                            <CardHeader className='pb-3 border-b border-border'>
                                <Skeleton className='h-6 w-48' />
                            </CardHeader>
                            <CardContent className='pt-5 space-y-3'>
                                <Skeleton className='h-24 w-full' />
                                <Skeleton className='h-24 w-full' />
                                <Skeleton className='h-11 w-full mt-4' />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Nutrition Card Skeleton */}
                    <div className='lg:col-span-1'>
                        <Card className='border-border bg-card/50'>
                            <CardHeader className='pb-3 border-b border-border'>
                                <Skeleton className='h-6 w-40' />
                            </CardHeader>
                            <CardContent className='pt-4 space-y-3'>
                                <Skeleton className='h-16 w-full' />
                                <Skeleton className='h-16 w-full' />
                                <Skeleton className='h-16 w-full' />
                                <Skeleton className='h-16 w-full' />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
