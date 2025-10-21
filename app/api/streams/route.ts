import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from '@/app/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const YT_REGEX = /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/;

const CreateStreamSchema = z.object({
    creatorId: z.string(),
    url: z.string(),
    userName: z.string()
});

const DeleteStreamSchema = z.object({
    id: z.string()
})

// Helper function to extract YouTube video ID
function extractYouTubeId(url: string): string | null {
    const match = url.match(YT_REGEX);
    return match ? match[1] : null;
}

// Fetch YouTube video metadata using oEmbed API (no library needed!)
async function getYouTubeMetadata(videoId: string) {
    try {
        const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch video metadata');
        }

        const data = await response.json();
        
        return {
            title: data.title || "Unknown title",
            thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            smallImg: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            bigImg: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            author: data.author_name || "Unknown"
        };
    } catch (error) {
        console.error("Error fetching YouTube metadata:", error);
        // Fallback to default thumbnails
        return {
            title: "Unknown title",
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            smallImg: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            bigImg: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            author: "Unknown"
        };
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = CreateStreamSchema.parse(body);

        const extractedId = extractYouTubeId(data.url);

        if (!extractedId) {
            return NextResponse.json({
                message: 'Invalid YouTube URL. Please provide a valid YouTube link.'
            }, {
                status: 400
            });
        }

        // Check for duplicate streams
        const existingStream = await prismaClient.stream.findFirst({
            where: {
                userId: data.creatorId,
                extractedId: extractedId
            }
        });

        if (existingStream) {
            return NextResponse.json({
                message: 'This video has already been added to your streams',
                id: existingStream.id
            }, {
                status: 409
            });
        }

        // Fetch metadata using oEmbed API (no cache files!)
        const metadata = await getYouTubeMetadata(extractedId);
       
        const payload = {
            userId: data.creatorId,
            url: data.url,
            type: "Youtube",
            extractedId: extractedId,
            smallImg: metadata.smallImg,
            bigImg: metadata.bigImg,
            title: metadata.title,
            addedBy: data.userName
        };

        const stream = await prismaClient.stream.create({
            data: payload as any
        });

        return NextResponse.json({
            message: "Stream added successfully",
            id: stream.id
        }, {
            status: 201
        });

    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({
                message: 'Validation error'
            }, {
                status: 400
            });
        }
        
        console.error("Error adding stream:", err);
        
        return NextResponse.json({
            message: 'Error while adding stream. Please try again.',
            error: err instanceof Error ? err.message : 'Unknown error'
        }, {
            status: 500
        });
    }
}

export async function GET(req: NextRequest) {
    try {
        const creatorId = req.nextUrl.searchParams.get("creatorId");
        const session = await getServerSession(authOptions);

        const user = await prismaClient.user.findFirst({
            where: {
                email: session?.user?.email ?? ""
            }
        });

        if (!user) {
            return NextResponse.json({
                message: 'Unauthenticated User'
            }, {
                status: 401
            });
        }

        if (!creatorId) {
            return NextResponse.json({
                message: "Creator ID is required"
            }, {
                status: 400
            });
        }

        const [streams, activeStream] = await Promise.all([
            prismaClient.stream.findMany({
                where: {
                    userId: creatorId,
                    played: false
                },
                include: {
                    _count: {
                        select: {
                            upvotes: true
                        }
                    },
                    upvotes: {
                        where: {
                            userId: user.id
                        }
                    },
                }
            }),
            
            prismaClient.currentStream.findFirst({
                where: {
                    userId: creatorId
                },
                include: {
                    stream: true
                }
            })
        ]);

        return NextResponse.json({
            streams: streams.map(({ _count, upvotes, ...rest }) => ({
                ...rest,
                upvotes: _count.upvotes,
                hasUpvoted: upvotes.length > 0
            })),
            activeStream
        });

    } catch (err) {
        console.error("Error in GET /api/streams:", err);

        return NextResponse.json({
            message: "Error while fetching streams. Please try again."
        }, {
            status: 500
        });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const data = DeleteStreamSchema.parse(body);
        
        const stream = await prismaClient.stream.findFirst({
            where: {
                id: data.id
            }
        });

        if (!stream) {
            return NextResponse.json({
                message: 'Stream not found'
            }, {
                status: 404
            });
        }

        await prismaClient.stream.delete({
            where: {
                id: data.id
            }
        });

        return NextResponse.json({
            message: 'Song removed successfully'
        });
    } catch (err) {
        console.error("Error deleting stream:", err);
        return NextResponse.json({
            message: 'Error while deleting stream',
            error: err instanceof Error ? err.message : 'Unknown error'
        }, {
            status: 500
        });
    }
}