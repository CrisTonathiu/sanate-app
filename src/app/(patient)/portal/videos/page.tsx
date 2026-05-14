'use client';

import {useState, useEffect} from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Clock,
    Calendar,
    PlayCircle,
    Video,
    Filter,
    AlertCircle
} from 'lucide-react';
import {fetchVideos, VideoItem} from '@/lib/services/video.service';

const categories = [
    'Todas',
    'Básicos',
    'Planificación',
    'Recetas',
    'Bienestar'
];

export default function VideosPage() {
    const [activeCategory, setActiveCategory] = useState('Todas');
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadVideos = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const fetchedVideos = await fetchVideos(activeCategory);
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
    }, [activeCategory]);

    const filteredVideos = videos;

    return (
        <main className='min-h-screen bg-background px-4 py-6 md:px-6 lg:px-8'>
            <div className='mx-auto max-w-6xl'>
                {/* Back Button */}
                <Link
                    href='/portal'
                    className='mb-6 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                    <ArrowLeft className='h-4 w-4' />
                    Regresar
                </Link>

                {/* Header */}
                <div className='mb-6'>
                    <h1 className='text-2xl font-semibold text-foreground md:text-3xl'>
                        Videos Educativos
                    </h1>
                    <p className='mt-1 text-sm text-muted-foreground'>
                        Aprende sobre nutrición con orientación experta
                    </p>
                </div>

                {/* Category Filter */}
                <div className='mb-6 rounded-2xl bg-card p-4'>
                    <div className='mb-3 flex items-center gap-2 text-sm text-muted-foreground'>
                        <Filter className='h-4 w-4' />
                        <span>Filtrar por categoría</span>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                                    activeCategory === category
                                        ? 'bg-accent text-accent-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                                }`}>
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Video Grid */}
                {isLoading ? (
                    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className='rounded-2xl bg-card p-3'>
                                <div className='mb-3 aspect-video animate-pulse rounded-xl bg-muted'></div>
                                <div className='space-y-2'>
                                    <div className='h-4 animate-pulse rounded bg-muted'></div>
                                    <div className='h-3 animate-pulse rounded bg-muted'></div>
                                    <div className='h-3 w-1/2 animate-pulse rounded bg-muted'></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className='rounded-2xl bg-red-500/10 border border-red-500/20 p-8 text-center'>
                        <AlertCircle className='mx-auto mb-4 h-12 w-12 text-red-400' />
                        <p className='text-sm font-medium text-red-400'>
                            {error}
                        </p>
                    </div>
                ) : (
                    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        {filteredVideos.map(video => (
                            <Link
                                key={video.id}
                                href={`videos/${video.id}`}
                                className='group rounded-2xl bg-card p-3 text-left transition-colors hover:bg-muted/50'>
                                {/* Thumbnail */}
                                <div className='relative mb-3 aspect-video overflow-hidden rounded-xl bg-muted'>
                                    <div className='flex h-full items-center justify-center'>
                                        <PlayCircle className='h-12 w-12 text-muted-foreground transition-colors group-hover:text-primary' />
                                    </div>
                                    {/* Category Badge */}
                                    <div className='absolute left-2 top-2 rounded-lg bg-accent/90 px-2 py-1 text-xs font-medium text-accent-foreground'>
                                        {video.category}
                                    </div>
                                </div>

                                {/* Video Info */}
                                <h3 className='mb-1 line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary'>
                                    {video.title}
                                </h3>
                                <p className='mb-3 line-clamp-2 text-xs text-muted-foreground'>
                                    {video.description}
                                </p>

                                {/* Meta */}
                                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                                    <Calendar className='h-3 w-3' />
                                    <span>{video.uploadedAt}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && filteredVideos.length === 0 && (
                    <div className='rounded-2xl bg-card p-8 text-center'>
                        <Video className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                        <p className='text-sm font-medium text-foreground'>
                            No se encontraron videos
                        </p>
                        <p className='mt-1 text-xs text-muted-foreground'>
                            Prueba seleccionar otra categoría
                        </p>
                    </div>
                )}

                {/* Footer */}
                <p className='mt-6 text-center text-xs text-muted-foreground'>
                    Se agrega contenido educativo nuevo regularmente
                </p>
            </div>
        </main>
    );
}
