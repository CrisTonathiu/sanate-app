import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireRole} from '@/lib/auth/requireRole';

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requireRole('ADMIN');

        const body = await request.json();
        const {
            title,
            description,
            category,
            fileName,
            size,
            storagePath,
            publicUrl
        } = body;

        // Validate required fields
        if (!title || !description || !category || !storagePath) {
            return NextResponse.json(
                {success: false, message: 'Missing required fields'},
                {status: 400}
            );
        }

        // Create video record
        const video = await prisma.video.create({
            data: {
                title,
                description,
                category,
                fileName,
                size: parseInt(size) || 0,
                storagePath,
                publicUrl,
                uploadedBy: {
                    connect: {id: currentUser.id}
                }
            }
        });

        return NextResponse.json(
            {
                success: true,
                data: {id: video.id},
                message: 'Video saved successfully'
            },
            {status: 201}
        );
    } catch (error) {
        console.error('Error saving video:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error saving video to database'
            },
            {status: 500}
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const {searchParams} = new URL(request.url);
        const category = searchParams.get('category');

        const videos = await prisma.video.findMany({
            where: category && category !== 'Todas' ? {category} : undefined,
            include: {
                uploadedBy: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform to match the expected format
        const formattedVideos = videos.map(video => ({
            id: video.id,
            title: video.title,
            description: video.description,
            category: video.category,
            fileName: video.fileName,
            size: video.size,
            storagePath: video.storagePath,
            publicUrl: video.publicUrl,
            uploadedAt: video.createdAt.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            uploadedBy: video.uploadedBy
        }));

        return NextResponse.json({
            success: true,
            data: formattedVideos
        });
    } catch (error) {
        console.error('Error fetching videos:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error fetching videos'
            },
            {status: 500}
        );
    }
}
