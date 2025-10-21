"use client";

import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useSocket } from "@/app/providers/SocketProvider";
import Image from "next/image";

// Types for better type safety
interface Stream {
    id: string;
    title: string;
    smallImg?: string;
    thumbnail: string;
    type?: string;
    duration?: string;
    addedBy?: string;
    upvotes: number;
    hasUpvoted: boolean;
}

interface VoteUpdateData {
    songId: string;
    upvotes: number;
    hasUpvoted: boolean;
    userId: string;
}

export default function Queue({ creatorId }: { creatorId?: string }) {
    const { data: session } = useSession();
    const { socket, isConnected } = useSocket();
    const [addSongOpen, setAddSongOpen] = useState<boolean>(false);
    const [streams, setStreams] = useState<Stream[]>([]);
    const [songUrl, setSongUrl] = useState<string>("");
    const [votingStates, setVotingStates] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAddingSong, setIsAddingSong] = useState<boolean>(false);
    const [currentStream, setCurrentStream] = useState<any>(null);
    
    // Use ref to prevent stale closure issues
    const streamsRef = useRef<Stream[]>([]);
    const sessionIdRef = useRef(session?.user?.id);

    // Update refs when values change
    useEffect(() => {
        streamsRef.current = streams;
    }, [streams]);

    useEffect(() => {
        sessionIdRef.current = session?.user?.id;
    }, [session?.user?.id]);

    // Memoized user ID
    const userId = useMemo(() => 
        creatorId || session?.user?.id, 
        [creatorId, session?.user?.id]
    );

    // Refresh streams function
    const refreshStream = useCallback(async () => {
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
    }, [userId]);

    // Initial load
    useEffect(() => {
        refreshStream();
    }, [refreshStream]);

    // Setup vote-update listener with better dependency handling
    useEffect(() => {
        if (!socket) return;

        const handleVoteUpdate = (data: VoteUpdateData) => {
            console.log("Received vote-update:", data);

            setStreams((prevStreams) =>
                prevStreams.map((stream) => {
                    if (stream.id === data.songId) {
                        // Only update hasUpvoted if it's for the current user
                        const shouldUpdateHasUpvoted = data.userId === sessionIdRef.current;
                        return {
                            ...stream,
                            upvotes: data.upvotes,
                            hasUpvoted: shouldUpdateHasUpvoted ? data.hasUpvoted : stream.hasUpvoted,
                        };
                    }
                    return stream;
                })
            );
        };

        socket.on("vote-update", handleVoteUpdate);

        return () => {
            socket.off("vote-update", handleVoteUpdate);
        };
    }, [socket]);

    // Refresh streams on reconnect
    useEffect(() => {
        if (!socket) return;

        const handleReconnect = () => {
            console.log("Socket reconnected, refreshing streams...");
            refreshStream();
        };

        socket.on("reconnect", handleReconnect);

        return () => {
            socket.off("reconnect", handleReconnect);
        };
    }, [socket, refreshStream]);

    // Connection status toast
    useEffect(() => {
        if (isConnected) {
            toast.success("Connected to live updates", {
                duration: 2000,
                id: 'socket-connected'
            });
        }
    }, [isConnected]);

    // Optimized vote handler
    const handleVote = useCallback(async (songId: string) => {
        if (votingStates[songId] || !session?.user?.id) {
            console.log('Skipping vote - already voting or not logged in');
            return;
        }

        setVotingStates((prev) => ({ ...prev, [songId]: true }));

        try {
            const song = streamsRef.current.find((s) => s.id === songId);
            if (!song) {
                throw new Error('Song not found');
            }

            const endpoint = song.hasUpvoted ? "downvote" : "upvote";
            const newHasUpvoted = !song.hasUpvoted;
            const newVotes = (song.upvotes || 0) + (newHasUpvoted ? 1 : -1);

            // Optimistic update
            setStreams((prev) =>
                prev.map((s) => (s.id === songId ? { ...s, upvotes: newVotes, hasUpvoted: newHasUpvoted } : s))
            );

            // Emit socket event immediately if connected
            if (socket && isConnected) {
                socket.emit("vote-update", {
                    songId,
                    upvotes: newVotes,
                    hasUpvoted: newHasUpvoted,
                    userId: session.user.id,
                });
            }

            // API call
            const response = await axios.post(`/api/streams/${endpoint}`, {
                streamId: songId,
            });

            console.log("Vote completed:", response.data);

            // Sync with server response if different
            if (response.data.upvotes !== newVotes || response.data.hasUpvoted !== newHasUpvoted) {
                setStreams((prev) =>
                    prev.map((s) => (s.id === songId ? {
                        ...s,
                        upvotes: response.data.upvotes,
                        hasUpvoted: response.data.hasUpvoted
                    } : s))
                );
            }

        } catch (error) {
            console.error("❌ Vote failed:", error);
            toast.error("Failed to update vote");
            // Revert on error
            await refreshStream();
        } finally {
            // Clear voting state
            setTimeout(() => {
                setVotingStates((prev) => {
                    const newState = { ...prev };
                    delete newState[songId];
                    return newState;
                });
            }, 300);
        }
    }, [votingStates, session?.user?.id, socket, isConnected, refreshStream]);

    // Add song handler
    const handleAddSong = useCallback(async () => {
        if (!songUrl.trim() || !session?.user?.id) {
            toast.error("Please enter a valid URL and login");
            return;
        }

        setIsAddingSong(true);

        try {
            await axios.post("/api/streams", {
                url: songUrl,
                creatorId: session.user.id,
                userName: session.user.name,
            });
            
            toast.success("Song added successfully");
            setSongUrl("");
            setAddSongOpen(false);
            await refreshStream();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Error while adding song";
            toast.error(errorMessage);
        } finally {
            setIsAddingSong(false);
        }
    }, [songUrl, session?.user?.id, session?.user?.name, refreshStream]);

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl h-full flex flex-col">
            <CardContent className="p-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold">Queue</h3>
                        <p className="text-sm text-muted-foreground">
                            {streams.length} {streams.length === 1 ? 'song' : 'songs'} waiting
                            {isConnected ? (
                                <span className="ml-2 text-green-500 animate-pulse">● Live</span>
                            ) : (
                                <span className="ml-2 text-red-500">● Offline</span>
                            )}
                        </p>
                    </div>

                    {/* Add Song Dialog */}
                    <Dialog open={addSongOpen} onOpenChange={setAddSongOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Song
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border">
                            <DialogHeader>
                                <DialogTitle>Add a Song</DialogTitle>
                                <DialogDescription>
                                    Paste a YouTube or Spotify URL to add a song to the queue
                                </DialogDescription>
                            </DialogHeader>
                            <Tabs defaultValue="url" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="url">URL</TabsTrigger>
                                    <TabsTrigger value="search">Search</TabsTrigger>
                                </TabsList>
                                <TabsContent value="url" className="space-y-4">
                                    <Input
                                        placeholder="https://youtube.com/watch?v=..."
                                        value={songUrl}
                                        onChange={(e) => setSongUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !isAddingSong && handleAddSong()}
                                        disabled={isAddingSong}
                                        className="bg-background border-input"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Supports YouTube and Spotify links
                                    </p>
                                </TabsContent>
                                <TabsContent value="search" className="space-y-4">
                                    <Input
                                        placeholder="Search for a song..."
                                        className="bg-background border-input"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Search across YouTube and Spotify
                                    </p>
                                </TabsContent>
                            </Tabs>
                            <DialogFooter>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setAddSongOpen(false)}
                                    disabled={isAddingSong}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-primary hover:bg-primary/90"
                                    onClick={handleAddSong}
                                    disabled={!songUrl.trim() || isAddingSong}
                                >
                                    {isAddingSong ? (
                                        <>
                                            <span className="animate-spin mr-2">⏳</span>
                                            Adding...
                                        </>
                                    ) : (
                                        'Add to Queue'
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Queue List */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 space-y-3 min-h-0">
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Loading songs...</p>
                        </div>
                    ) : streams.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No songs in queue yet</p>
                            <p className="text-sm mt-2">Add your first song to get started!</p>
                        </div>
                    ) : (
                        streams.map((song, index) => (
                            <div
                                key={song.id}
                                className="group flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/50 hover:border-border transition-all duration-200"
                            >
                                <div className="flex items-center justify-center w-8 text-muted-foreground font-medium text-sm">
                                    #{index + 1}
                                </div>

                                <Image
                                    src={song.smallImg || song.thumbnail}
                                    width={64}
                                    height={64}
                                    alt={song.title}
                                    className="w-16 h-16 rounded-lg object-cover shadow-md"
                                />

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
                                        {song.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-sm text-muted-foreground truncate">
                                            {song.type || "YouTube"}
                                        </p>
                                        {song.duration && (
                                            <>
                                                <span className="text-muted-foreground/50">•</span>
                                                <span className="text-xs text-muted-foreground">{song.duration}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Avatar className="w-4 h-4">
                                            <AvatarFallback className="bg-muted text-muted-foreground text-[8px]">
                                                {song.addedBy?.charAt(0).toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs text-muted-foreground">
                                            {song.addedBy || "Unknown"}
                                        </span>
                                    </div>
                                </div>

                                {/* Voting Button */}
                                <div className="flex items-center gap-2 bg-secondary/40 rounded-full p-1">
                                    <Button
                                        size="sm"
                                        variant={song.hasUpvoted ? "secondary" : "default"}
                                        onClick={() => handleVote(song.id)}
                                        disabled={votingStates[song.id]}
                                        className="h-8 px-3 rounded-md transition-all"
                                    >
                                        {song.hasUpvoted ? (
                                            <ChevronDown className="w-5 h-5" />
                                        ) : (
                                            <ChevronUp className="w-5 h-5" />
                                        )}
                                    </Button>

                                    <span className="font-semibold text-sm px-2 min-w-[2rem] text-center">
                                        {song.upvotes || 0}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}