import {NextRequest, NextResponse} from 'next/server';
import {fetchVideoById} from '@/lib/services/video.service';

export async function GET(
    request: NextRequest,
    {params}: {params: Promise<{videoId: string}>}
) {
    try {
        const {videoId} = await params;

        const video = await fetchVideoById(videoId);

        if (!video) {
            return NextResponse.json(
                {success: false, message: 'Video not found'},
                {status: 404}
            );
        }

        return NextResponse.json({
            success: true,
            data: video
        });
    } catch (error) {
        console.error('Error fetching video:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Error fetching video'
            },
            {status: 500}
        );
    }
}
