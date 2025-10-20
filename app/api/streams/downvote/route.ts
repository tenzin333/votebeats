
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/app/lib/db";
import { authOptions } from "../../auth/[...nextauth]/route";

const UpvoteStreamSchema = z.object({
    streamId: z.string()
})

export async function POST(req: NextRequest) {
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

    try {
        const data = UpvoteStreamSchema.parse(await req.json());

        const res = await prismaClient.upvote.delete({
            where: {
                userId_streamId: {
                    userId: user.id,
                    streamId: data.streamId
                }
            }
        })

        return NextResponse.json({
            data: res
        })

    } catch (error) {
        return NextResponse.json({
            message: 'Error while upvote'
        }, {
            status: 411
        })
    }

}