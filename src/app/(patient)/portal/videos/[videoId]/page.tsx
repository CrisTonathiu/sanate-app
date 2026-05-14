import Link from 'next/link';
import {
    ArrowLeft,
    Play,
    Calendar,
    Tag,
    PlayCircle,
    ChevronRight
} from 'lucide-react';
import {
    fetchVideoById,
    fetchVideos,
    VideoItem
} from '@/lib/services/video.service';

export default async function VideoDetailPage({
    params
}: {
    params: Promise<{videoId: string}>;
}) {
    const {videoId} = await params;

    try {
        const video = await fetchVideoById(videoId);

        if (!video) {
            return (
                <main className='min-h-screen bg-background px-4 py-6 md:px-6 lg:px-8'>
                    <div className='mx-auto max-w-4xl'>
                        <Link
                            href='/portal/videos'
                            className='mb-6 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                            <ArrowLeft className='h-4 w-4' />
                            Volver a Videos
                        </Link>
                        <div className='rounded-2xl bg-card p-8 text-center'>
                            <PlayCircle className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                            <p className='text-sm font-medium text-foreground'>
                                Video no encontrado
                            </p>
                            <p className='mt-1 text-xs text-muted-foreground'>
                                El video que buscas no existe
                            </p>
                        </div>
                    </div>
                </main>
            );
        }

        const relatedVideos = (await fetchVideos(video.category))
            .filter(related => related.id !== video.id)
            .slice(0, 3);

        return (
            <main className='min-h-screen bg-background px-4 py-6 md:px-6 lg:px-8'>
                <div className='mx-auto max-w-4xl'>
                    {/* Back Button */}
                    <Link
                        href='/portal/videos'
                        className='mb-6 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                        <ArrowLeft className='h-4 w-4' />
                        Volver a Videos
                    </Link>

                    {/* Video Player */}
                    <div className='mb-6 overflow-hidden rounded-2xl bg-card'>
                        <div className='aspect-video bg-black'>
                            {video.publicUrl ? (
                                <video controls className='h-full w-full'>
                                    <source
                                        src={video.publicUrl}
                                        type='video/mp4'
                                    />
                                    Tu navegador no soporta el elemento de
                                    video.
                                </video>
                            ) : (
                                <div className='flex h-full items-center justify-center'>
                                    <div className='text-center'>
                                        <div className='mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-accent'>
                                            <Play className='h-10 w-10 text-accent-foreground' />
                                        </div>
                                        <p className='text-sm text-muted-foreground'>
                                            Video no disponible
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Video Info Card */}
                    <div className='mb-6 rounded-2xl bg-card p-4 md:p-6'>
                        {/* Title */}
                        <h1 className='mb-4 text-xl font-semibold text-foreground md:text-2xl'>
                            {video.title}
                        </h1>

                        {/* Meta Info */}
                        <div className='mb-4 flex flex-wrap items-center gap-4'>
                            <div className='flex items-center gap-2 rounded-xl bg-muted px-3 py-2'>
                                <Calendar className='h-4 w-4 text-accent' />
                                <span className='text-sm text-foreground'>
                                    {video.uploadedAt}
                                </span>
                            </div>
                            <div className='flex items-center gap-2 rounded-xl bg-accent px-3 py-2'>
                                <Tag className='h-4 w-4 text-accent-foreground' />
                                <span className='text-sm font-medium text-accent-foreground'>
                                    {video.category}
                                </span>
                            </div>
                            {video.uploadedBy && (
                                <div className='flex items-center gap-2 rounded-xl bg-muted px-3 py-2'>
                                    <span className='text-sm text-foreground'>
                                        Por {video.uploadedBy.firstName}{' '}
                                        {video.uploadedBy.lastName}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className='rounded-xl bg-muted/50 p-4'>
                            <p className='text-sm leading-relaxed text-muted-foreground'>
                                {video.description}
                            </p>
                        </div>
                    </div>

                    {/* Related Videos */}
                    {relatedVideos.length > 0 && (
                        <div className='rounded-2xl bg-card p-4 md:p-6'>
                            <h2 className='mb-4 text-base font-semibold text-foreground'>
                                Más en {video.category}
                            </h2>
                            <div className='space-y-3'>
                                {relatedVideos.map(related => (
                                    <Link
                                        key={related.id}
                                        href={`/portal/videos/${related.id}`}
                                        className='group flex items-center gap-4 rounded-xl bg-muted/50 p-3 transition-colors hover:bg-muted'>
                                        <div className='relative flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-muted'>
                                            <PlayCircle className='h-6 w-6 text-muted-foreground transition-colors group-hover:text-amber-400' />
                                        </div>

                                        <div className='min-w-0 flex-1'>
                                            <p className='mb-1 line-clamp-1 text-sm font-medium text-foreground group-hover:text-amber-400'>
                                                {related.title}
                                            </p>
                                            <p className='line-clamp-1 text-xs text-muted-foreground'>
                                                {related.description}
                                            </p>
                                        </div>

                                        <ChevronRight className='h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-amber-400' />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <p className='mt-6 text-center text-xs text-muted-foreground'>
                        Contenido proporcionado por tu equipo de nutrición
                    </p>
                </div>
            </main>
        );
    } catch (error) {
        console.error('Error loading video:', error);
        return (
            <main className='min-h-screen bg-background px-4 py-6 md:px-6 lg:px-8'>
                <div className='mx-auto max-w-4xl'>
                    <Link
                        href='/portal/videos'
                        className='mb-6 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                        <ArrowLeft className='h-4 w-4' />
                        Volver a Videos
                    </Link>
                    <div className='rounded-2xl bg-card p-8 text-center'>
                        <PlayCircle className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                        <p className='text-sm font-medium text-foreground'>
                            Error al cargar el video
                        </p>
                        <p className='mt-1 text-xs text-muted-foreground'>
                            Por favor intenta de nuevo más tarde
                        </p>
                    </div>
                </div>
            </main>
        );
    }
}
