"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from 'sonner';
import CurrentPlaying from "./CurrentPlayer";
import Queue from './Queue';
import {  Share2 } from 'lucide-react';
import { Button } from './ui/button';

// const REFRESH_INTERVAL = 10 * 1000;

interface Stream {
    id: string;
    upvotes: number;
    // Add other stream properties here
}

interface StreamViewProps {
    creatorId: string;
    playVideo:boolean

}

export default function StreamView({ 
    creatorId,
    playVideo=false
 }: StreamViewProps) {
    const [streams, setStreams] = useState<Stream[]>([]);
    const [currentStream , setCurrentStream] = useState<any>();
    const [isLoading, setIsLoading] = useState(false);
    const { data: session } = useSession();
    const abortControllerRef = useRef<AbortController | null>(null);

    const refreshStream = useCallback(async () => {
        const userId = creatorId || session?.user?.id;
        if (!userId) return;
        setIsLoading(true);

        try {
            const res = await axios.get(`/api/streams?creatorId=${userId}`);

            const sortedStreams = [...res.data.streams].sort((a, b) => {
                return (b.upvotes || 0) - (a.upvotes || 0);
            });
            setStreams(sortedStreams);
            setCurrentStream(res.data.activeStream.stream);
        } catch (err) {
            toast.error("Failed to load streams");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [creatorId, session?.user?.id]);

    useEffect(() => {
        if (!creatorId && !session?.user?.id) {
            console.log("Waiting for session...");
            return;
        }

        refreshStream();
        // const interval = setInterval(refreshStream, REFRESH_INTERVAL);

        // return () => {
        //     clearInterval(interval);
        //     // Cancel any pending requests on unmount
        //     if (abortControllerRef.current) {
        //         abortControllerRef.current.abort();
        //     }
        // };
    }, []);


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
                    className='hover:bg-blue-500 hover:text-white hover:bg-black transition-colors' 
                    onClick={handleShareLink}
                    aria-label="Share stream link"
                >
                    <Share2  className="h-4 w-4" />
                </Button>
            </div>

            <CurrentPlaying currentStream={currentStream} 
             playVideo={playVideo}
             setCurrentStream={setCurrentStream}
            />
            <Queue 
                streams={streams} 
                refreshStream={refreshStream} 
                setStreams={setStreams}
                creatorId={creatorId}
                isLoading={isLoading}
            />
        </div>
    );
}