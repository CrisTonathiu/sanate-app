'use server';

import {prisma} from '../prisma';

export interface VideoItem {
    id: string;
    title: string;
    description: string;
    category: string;
    fileName: string | null;
    size: number;
    storagePath: string;
    publicUrl: string | null;
    uploadedAt: string;
    uploadedBy: {
        firstName: string;
        lastName: string;
    };
}

function formatUploadedAt(createdAt: Date): string {
    return createdAt.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function toVideoItem(video: {
    id: string;
    title: string;
    description: string;
    category: string;
    fileName: string | null;
    size: number;
    storagePath: string;
    publicUrl: string | null;
    createdAt: Date;
    uploadedBy: {firstName: string; lastName: string};
}): VideoItem {
    return {
        id: video.id,
        title: video.title,
        description: video.description,
        category: video.category,
        fileName: video.fileName,
        size: video.size,
        storagePath: video.storagePath,
        publicUrl: video.publicUrl,
        uploadedAt: formatUploadedAt(video.createdAt),
        uploadedBy: video.uploadedBy
    };
}

export async function fetchVideos(
    category?: string
): Promise<VideoItem[]> {
    try {
        const videos = await prisma.video.findMany({
            where:
                category && category !== 'Todas' ? {category} : undefined,
            include: {
                uploadedBy: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {createdAt: 'desc'}
        });

        return videos.map(toVideoItem);
    } catch (error) {
        console.error('Error fetching videos:', error);
        throw error;
    }
}

export async function fetchVideoById(
    videoId: string
): Promise<VideoItem | null> {
    try {

        console.log('Fetching video by ID:', videoId);
        const video = await prisma.video.findUnique({
            where: {id: videoId},
            include: {
                uploadedBy: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        if (!video) {
            return null;
        }

        return toVideoItem(video);
    } catch (error) {
        console.error('Error fetching video:', error);
        throw error;
    }
}
