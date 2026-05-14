'use client';

import {useState, useEffect} from 'react';
import Link from 'next/link';
import {Plus, PlayCircle, AlertCircle} from 'lucide-react';
import {fetchVideos, VideoItem} from '@/lib/services/video.service';
import {motion} from 'framer-motion';
import {Button} from '@/components/ui/button';

export default function VideosPage() {
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadVideos = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const fetchedVideos = await fetchVideos();
                setVideos(fetchedVideos);
            } catch (err) {
                console.error('Error loading videos:', err);
                setError(
                    'Error al cargar los videos. Por favor intenta de nuevo.'
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadVideos();
    }, []);

    return (
        <main className='relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6'>
            {/* Header */}
            <motion.div
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                className='mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                            Videos
                        </h1>
                    </div>
                    <Button
                        asChild
                        className='h-11 px-5 rounded-xl font-medium shadow-lg shadow-primary/25'>
                        <Link href='/videos/subir'>
                            <Plus className='h-4 w-4' />
                            Subir Video
                        </Link>
                    </Button>
                </div>
            </motion.div>

            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {isLoading ? (
                    // Loading skeleton
                    [...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className='rounded-2xl bg-card p-4 shadow-sm'>
                            <div className='mb-4 h-40 animate-pulse rounded-2xl bg-muted'></div>
                            <div className='space-y-2'>
                                <div className='flex items-center gap-2'>
                                    <div className='h-7 w-7 animate-pulse rounded-full bg-muted'></div>
                                    <div className='h-3 w-16 animate-pulse rounded bg-muted'></div>
                                    <div className='h-3 w-px bg-muted'></div>
                                    <div className='h-3 w-20 animate-pulse rounded bg-muted'></div>
                                </div>
                                <div className='h-4 w-3/4 animate-pulse rounded bg-muted'></div>
                                <div className='space-y-1'>
                                    <div className='h-3 animate-pulse rounded bg-muted'></div>
                                    <div className='h-3 w-2/3 animate-pulse rounded bg-muted'></div>
                                </div>
                                <div className='flex items-center justify-between gap-3'>
                                    <div className='h-5 w-16 animate-pulse rounded-full bg-muted'></div>
                                    <div className='h-3 w-20 animate-pulse rounded bg-muted'></div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : error ? (
                    <div className='col-span-full rounded-2xl bg-red-500/10 border border-red-500/20 p-8 text-center'>
                        <AlertCircle className='mx-auto mb-4 h-12 w-12 text-red-400' />
                        <p className='text-sm font-medium text-red-400'>
                            {error}
                        </p>
                    </div>
                ) : videos.length === 0 ? (
                    <div className='col-span-full rounded-2xl bg-card p-8 text-center'>
                        <PlayCircle className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                        <p className='text-sm font-medium text-foreground'>
                            No hay videos subidos aún
                        </p>
                        <p className='mt-1 text-xs text-muted-foreground'>
                            Usa el botón «Subir Video» para agregar contenido
                        </p>
                    </div>
                ) : (
                    videos.map(video => (
                        <div
                            key={video.id}
                            className='group rounded-2xl bg-card p-4 shadow-sm transition hover:bg-muted'>
                            <div className='mb-4 overflow-hidden rounded-2xl bg-muted'>
                                <Link href={`/videos/${video.id}`} className='flex h-40 items-center justify-center'>
                                    <PlayCircle className='h-12 w-12 text-muted-foreground group-hover:text-primary' />
                                </Link>
                            </div>
                            <div className='flex items-center gap-2 text-xs text-muted-foreground mb-3'>
                                <div className='inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground'>
                                    <PlayCircle className='h-4 w-4' />
                                </div>
                                <span>{video.uploadedAt}</span>
                            </div>
                            <h2 className='mb-2 text-sm font-semibold text-foreground'>
                                {video.title}
                            </h2>
                            <p className='mb-4 text-xs text-muted-foreground line-clamp-3'>
                                {video.description}
                            </p>
                            <div className='flex items-center justify-between gap-3'>
                                <span className='rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-accent-foreground'>
                                    {video.category}
                                </span>
                                <Link
                                    href={`/videos/${video.id}`}
                                    className='text-xs font-medium text-accent hover:text-accent/90'>
                                    Ver detalle
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <p className='mt-8 text-center text-xs text-muted-foreground'>
                Usa el botón «Subir Video» para agregar nuevo contenido a la
                biblioteca.
            </p>
        </main>
    );
}
