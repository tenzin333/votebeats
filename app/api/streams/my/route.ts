import { prismaClient } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions); // pass authOptions if needed
    const creatorId = req.nextUrl.searchParams.get("creatorId");

    let user;
    if (!creatorId && session?.user?.email) {
      user = await prismaClient.user.findUnique({
        where: { email: session.user.email }
      });
    }

    const userId = user?.id || creatorId;

    if (!userId) {
      return NextResponse.json({ message: "User not found" }, { status: 400 });
    }

    const streams = await prismaClient.stream.findMany({
      where: { userId },
      include: {
        _count: { select: { upvotes: true } },
        upvotes: { where: { userId: user?.id } },
      },
    });

    const formattedStreams = streams.map(({ _count, upvotes, ...rest }) => ({
      ...rest,
      upvotes: _count.upvotes,
      hasUpvoted: upvotes.length > 0
    }));

    return NextResponse.json({ streams: formattedStreams });
  } catch (err) {
    console.error("Error in GET /api/streams:", err);
    return NextResponse.json(
      { message: "Error while fetching streams. Please try again." },
      { status: 500 }
    );
  }
}