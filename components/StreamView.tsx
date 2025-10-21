"use client";

import { useEffect, useState, useCallback } from 'react';
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from 'sonner';
import CurrentPlaying from "./CurrentPlayer";
import Queue from './Queue';
import { Share2 } from 'lucide-react';
import { Button } from './ui/button';

interface Stream {
    id: string;
    upvotes: number;
    userId: string;
    url: string;
    extractedId: string;
    type: string;
    title: string;
    smallImg: string;
    bigImg: string;
    played: boolean;
    playedTs?: Date;
    createAt: Date;
}

interface ActiveStream {
    stream: Stream | null;
}

interface StreamViewProps {
    creatorId?: string;
    playVideo: boolean;
}

export default function StreamView({ 
    creatorId,
    playVideo = false
}: StreamViewProps) {
    const [streams, setStreams] = useState<Stream[]>([]);
    const [currentStream, setCurrentStream] = useState<Stream | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { data: session } = useSession();

    const refreshStream = useCallback(async () => {
        const userId = creatorId || session?.user?.id;
        if (!userId) return;
        
        setIsLoading(true);

        try {
            const res = await axios.get(`/api/streams?creatorId=${userId}`);

            const sortedStreams = [...res.data.streams].sort((a: Stream, b: Stream) => 
                (b.upvotes || 0) - (a.upvotes || 0)
            );
            
            setStreams(sortedStreams);
            setCurrentStream(res.data.activeStream?.stream || null);
        } catch (err) {
            toast.error("Failed to load streams");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [creatorId, session?.user?.id]);

    useEffect(() => {
        if (!creatorId && !session?.user?.id) return;
        
        refreshStream();
    }, [creatorId, session?.user?.id, refreshStream]);

    const handleShareLink = async () => {
        const userId = creatorId || session?.user?.id;
        if (!userId) {
            toast.error("No user ID available");
            return;
        }

        const shareUrl = `${window.location.origin}/creator/${userId}`;

        // Try native share first
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Join my stream queue 🎵",
                    text: "Vote or add songs to my stream!",
                    url: shareUrl,
                });
                toast.success("Link shared!");
            } catch (err) {
                // User cancelled share dialog
                if (err instanceof Error && err.name === "AbortError") {
                    return;
                }
                // Fallback to clipboard
                await copyToClipboard(shareUrl);
            }
        } else {
            // Fallback to clipboard
            await copyToClipboard(shareUrl);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Link copied to clipboard!");
        } catch (err) {
            toast.error("Failed to copy link");
            console.error(err);
        }
    };

    return (
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-6 lg:p-10">
            <div className='absolute top-2 right-2 sm:top-4 sm:right-4 lg:top-0 lg:right-10 z-10'>
                <Button 
                    size="icon"
                    variant="outline"
                    className='hover:bg-blue-500 hover:text-white transition-colors' 
                    onClick={handleShareLink}
                    aria-label="Share stream link"
                >
                    <Share2 className="h-4 w-4" />
                </Button>
            </div>

            <CurrentPlaying creatorId={creatorId || session?.user?.id} />
            <Queue creatorId={creatorId || session?.user?.id} />
        </div>
    );
}