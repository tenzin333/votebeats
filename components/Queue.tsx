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
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useSocket } from "@/app/providers/SocketProvider";
import Image from "next/image";

export default function Queue({
    streams,
    setStreams,
    refreshStream,
    creatorId,
    isLoading,
}: {
    streams: any[];
    setStreams: React.Dispatch<React.SetStateAction<any[]>>;
    refreshStream: () => void;
    creatorId: string;
    isLoading: boolean;
}) {
    const { data: session } = useSession();
    const { socket, isConnected } = useSocket();
    const [addSongOpen, setAddSongOpen] = useState(false);
    const [songUrl, setSongUrl] = useState("");
    const [votingStates, setVotingStates] = useState<Record<string, boolean>>({});
    const processingVote = useRef<string | null>(null); // Track vote being processed
    // Setup vote-update listener
    useEffect(() => {
        if (!socket) return;

        const handleVoteUpdate = (data: {
            songId: string;
            upvotes: number;
            hasUpvoted: boolean;
            userId: string
        }) => {
            // Skip if this is our own vote that we already optimistically updated
            // if (processingVote.current === data.songId && data.userId === session?.user?.id) {
            //     console.log("⏭️ Skipping own vote update (already optimistically updated)");
            //     processingVote.current = null;
            //     return;
            // }

            console.log("📥 Received vote-update from another user:", data);

            setStreams((prevStreams) =>
                prevStreams.map((stream) => {
                    if (stream.id === data.songId) {
                        return {
                            ...stream,
                            upvotes: data.upvotes,
                            hasUpvoted: data.userId === session?.user?.id ? data.hasUpvoted : stream.hasUpvoted,
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
    }, [socket, session?.user?.id, setStreams]);

    // Refresh streams on reconnect
    useEffect(() => {
        if (!socket) return;

        const handleReconnect = () => {
            console.log("🔄 Socket reconnected, refreshing streams...");
            refreshStream();
        };

        socket.on("reconnect", handleReconnect);

        return () => {
            socket.off("reconnect", handleReconnect);
        };
    }, [socket, refreshStream]);

    // Connection status toast (only show once)
    useEffect(() => {
        if (isConnected) {
            toast.success("🟢 Connected to live updates", {
                duration: 2000,
                id: 'socket-connected'
            });
        }
    }, [isConnected]);

    const handleVote = useCallback(async (songId: string) => {
        if (votingStates[songId] || !session?.user?.id) {
            console.log('⏭️ Skipping vote - already voting or not logged in');
            return;
        }

        setVotingStates((prev) => ({ ...prev, [songId]: true }));
        processingVote.current = songId; // Mark this vote as being processed

        try {
            const song = streams.find((s) => s.id === songId);
            if (!song) {
                throw new Error('Song not found');
            }

            const endpoint = song.hasUpvoted ? "downvote" : "upvote";
            const newHasUpvoted = !song.hasUpvoted;
            const newVotes = (song.upvotes || 0) + (newHasUpvoted ? 1 : -1);

            // IMMEDIATE optimistic update - user sees this instantly
            setStreams((prev) =>
                prev.map((s) => (s.id === songId ? { ...s, upvotes: newVotes, hasUpvoted: newHasUpvoted } : s))
            );

            // API call and socket emit in parallel (faster)
            const [response] = await Promise.all([
                axios.post(`/api/streams/${endpoint}`, {
                    streamId: songId,
                }),
                // Emit socket event immediately without waiting for API
                socket && isConnected ?
                    Promise.resolve(socket.emit("vote-update", {
                        songId,
                        upvotes: newVotes,
                        hasUpvoted: newHasUpvoted,
                        userId: session.user.id,
                    })) : Promise.resolve()
            ]);

            console.log("✅ Vote completed:", response.data);

            // Only update if server returned different values (rare)
            if (response.data.upvotes !== newVotes) {
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
            // Revert optimistic update
            refreshStream();
            processingVote.current = null;
        } finally {
            // Clear voting state quickly
            setTimeout(() => {
                setVotingStates((prev) => {
                    const newState = { ...prev };
                    delete newState[songId];
                    return newState;
                });
                processingVote.current = null;
            }, 300); // Reduced from 500ms
        }
    }, [votingStates, session?.user?.id, streams, socket, isConnected, setStreams, refreshStream]);

    const handleAddSong = useCallback(() => {
        if (!songUrl.trim() || !session?.user?.id) {
            toast.error("Please enter a valid URL and login");
            return;
        }

        axios.post("/api/streams", {
                url: songUrl,
                creatorId:session.user.id,
                userName: session.user.name,
            })
            .then(() => {
                toast.success("Song added successfully");
                setSongUrl("");
                setAddSongOpen(false);
                refreshStream();
            })
            .catch((err) => {
                const errorMessage = err.response?.data?.message || "Error while adding song";
                toast.error(errorMessage);
            });
    }, [songUrl, session?.user?.id, session?.user?.name, creatorId, refreshStream]);

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl h-md">
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold">Queue</h3>
                        <p className="text-sm text-muted-foreground">
                            {streams.length} songs waiting
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
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSong()}
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
                                <Button variant="outline" onClick={() => setAddSongOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-primary hover:bg-primary/90"
                                    onClick={handleAddSong}
                                    disabled={!songUrl.trim()}
                                >
                                    Add to Queue
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
                                    width={100}
                                    height={100}
                                    alt={song.title}
                                    className="w-16 h-16 rounded-lg object-cover shadow-md"
                                />

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold truncate group-hover:text-blue-400 transition-colors">
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
                                                {song.addedBy?.charAt(0) || "U"}
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
                                        variant={"default"}
                                        onClick={() => handleVote(song.id)}
                                        disabled={song.hasUpvoted}
                                        className={`h-8 px-3 rounded-md transition-all ${song.hasUpvoted} ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
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