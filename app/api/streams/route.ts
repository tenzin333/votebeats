import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from '@/app/lib/db';
import ytdl from '@distube/ytdl-core';
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

        // Fix: Use getInfo() and pass full URL or valid video ID format
        const info = await ytdl.getInfo(extractedId);
        const videoDetails = info.videoDetails;
        const thumbnails = videoDetails.thumbnails || [];
        const title = videoDetails.title || "Unknown title";

        // Sort thumbnails by width (ascending)
        thumbnails.sort((a, b) => (a.width || 0) - (b.width || 0));

        // Get second largest thumbnail, or largest if only one exists
        const smallImg = thumbnails.length > 1
            ? thumbnails[thumbnails.length - 2].url
            : (thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : "https://via.placeholder.com/1280x720");
        const bigImg = thumbnails[thumbnails.length - 1].url ?? "https://via.placeholder.com/1280x720";
       
        const payload = {
            userId: data.creatorId,
            url: data.url,
            type: "Youtube",
            extractedId: extractedId,
            smallImg: smallImg,
            bigImg: bigImg,
            title: title,
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
        }
        )

        if (!user) {
            return NextResponse.json({
                message: 'Unauthenticated User'
            }, {
                status: 411
            })
        }


        if (!creatorId) {
            return NextResponse.json({
                message: "Creator ID is required"
            }, {
                status: 400
            });
        }

        const [streams, activeStream] = await Promise.all([prismaClient.stream.findMany({
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
            streams: streams.map(({ _count, ...rest }) => ({
                ...rest,
                upvotes: _count.upvotes,
                hasUpvoted: rest.upvotes.length ? true : false
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
        const data = DeleteStreamSchema.parse(req.body);
        await prismaClient.stream.findFirst({
            where: {
                id: data.id
            }
        });
        return NextResponse.json({
            message: 'Song removed'
        })
    } catch (err) {
        return NextResponse.json({
            error: err
        })
    }
}