"use client";

import { Clock, Music, SkipForward, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Button } from "./ui/button";
import { useSession } from "next-auth/react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";

// Types
interface Stream {
  id: string;
  extractedId?: string;
  title?: string;
  type?: string;
  upvotes?: number;
  votes?: number;
  _count?: { upvotes?: number };
  addedBy?: string;
  duration?: string;
}

interface CurrentPlayingProps {
  creatorId?: string;
}

export default function CurrentPlaying({ creatorId }: CurrentPlayingProps) {
  const [progress, setProgress] = useState(0);
  const [playNextLoader, setPlayNextLoader] = useState<boolean>(false);
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const playerRef = useRef<any | null>(null);
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [playVideo, setPlayVideo] = useState<boolean>(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized user ID
  const userId = useMemo(() => 
    creatorId || session?.user?.id, 
    [creatorId, session?.user?.id]
  );

  // Fetch initial stream
  const fetchStream = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);

    try {
      const res = await axios.get(`/api/streams?creatorId=${userId}`);
      const activeStream = res.data.activeStream?.stream || null;
      setCurrentStream(activeStream);
      setPlayVideo(true);
    } catch (error) {
      console.error("Error fetching stream:", error);
      toast.error("Error while fetching stream");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchStream();
  }, [fetchStream]);

  // Fetch most upvoted stream
  const fetchMostUpvotedStream = useCallback(async () => {
    try {
      setPlayNextLoader(true);
      const res = await axios.get("/api/streams/next");
      console.log("Next stream:", res.data.stream);
      setCurrentStream(res.data.stream);
    } catch (err) {
      console.error("Error fetching next stream:", err);
      toast.error("Failed to load next song");
    } finally {
      setPlayNextLoader(false);
    }
  }, []);

  // Handle when stream ends
  const handleStreamNext = useCallback(() => {
    fetchMostUpvotedStream();
  }, [fetchMostUpvotedStream]);

  // Progress tracking
  const updateProgress = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      const currentTime = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration();
      
      if (duration > 0) {
        const calculatedProgress = (currentTime / duration) * 100;
        setProgress(calculatedProgress);
      }
    }
  }, []);

  // Start/stop progress tracking
  useEffect(() => {
    if (currentStream?.extractedId && playerRef.current) {
      // Start progress interval
      progressIntervalRef.current = setInterval(updateProgress, 1000);
    } else {
      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProgress(0);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [currentStream?.extractedId, updateProgress]);

  // Load YouTube IFrame API and handle video changes
  useEffect(() => {
    if (!currentStream?.extractedId) return;

    const createPlayer = () => {
      // Destroy existing player if it exists
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      playerRef.current = new (window as any).YT.Player("youtube-player", {
        videoId: currentStream.extractedId,
        events: {
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) {
              handleStreamNext();
            }
          },
          onReady: () => {
            console.log("YouTube player ready");
          },
          onError: (event: any) => {
            console.error("YouTube player error:", event.data);
            toast.error("Failed to load video");
          },
        },
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
        },
      });
    };

    if (!(window as any).YT) {
      // Load YouTube IFrame API
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    } else {
      if (!playerRef.current) {
        createPlayer();
      } else {
        // Load new video if player exists
        playerRef.current.loadVideoById(currentStream.extractedId);
      }
    }

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [currentStream?.extractedId, handleStreamNext]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden shadow-xl max-w-full">
        <CardContent className="p-0">
          <div className="relative">
            <div className="h-[400px] w-full aspect-video bg-gradient-to-br from-secondary to-background relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-secondary/50 flex items-center justify-center animate-pulse">
                  <Music className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback UI when no song is playing
  if (!currentStream) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden shadow-xl max-w-full">
        <CardContent className="p-0">
          <div className="relative">
            <div className="h-[400px] w-full aspect-video bg-gradient-to-br from-secondary to-background relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Music className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-base font-bold mb-1 text-muted-foreground">
                  No song playing
                </h2>
                <p className="text-xs text-muted-foreground/70">
                  Add a song to the queue to get started
                </p>
              </div>
            </div>
            {playVideo && (
              <div className="py-3 px-4">
                <Button 
                  variant="ghost" 
                  onClick={handleStreamNext}
                  disabled={playNextLoader}
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  {playNextLoader ? "Loading..." : "Play Next"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get vote count
  const voteCount = currentStream.upvotes || 
                    currentStream.votes || 
                    currentStream._count?.upvotes || 
                    0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden shadow-xl max-w-full">
      <CardContent className="p-0">
        <div className="relative">
          {/* Video Container */}
          <div className="h-[400px] w-full aspect-video bg-gradient-to-br from-secondary to-background relative overflow-hidden">
            {currentStream.extractedId ? (
              <div className="w-full h-full">
                <div id="youtube-player" className="w-full h-full" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                <Music className="w-12 h-12 text-muted-foreground" />
              </div>
            )}

            {/* Progress bar overlay */}
            {progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50">
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Song Info */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0 mr-3">
                <h2 className="text-lg font-bold mb-1 truncate">
                  {currentStream.title || "Unknown Title"}
                </h2>
                <p className="text-muted-foreground text-sm truncate">
                  {currentStream.type || "YouTube"}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1 bg-secondary/50 px-4 py-2 rounded-lg border border-border shrink-0">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-primary" />
                  <span className="text-lg font-bold">{voteCount}</span>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  votes
                </span>
              </div>
            </div>

            {/* Added By & Duration */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1.5">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                    {currentStream.addedBy?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span>{currentStream.addedBy || "Unknown"}</span>
              </div>
              {currentStream.duration && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{currentStream.duration}</span>
                  </div>
                </>
              )}
            </div>

            {/* Progress Bar */}
            {progress > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                {playVideo && (
                  <Button
                    variant="default"
                    onClick={handleStreamNext}
                    disabled={playNextLoader}
                    className="w-full"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    {playNextLoader ? "Loading..." : "Play Next"}
                  </Button>
                )}
              </div>
              {currentStream.extractedId && (
                <Link
                  href={`https://www.youtube.com/watch?v=${currentStream.extractedId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline whitespace-nowrap"
                >
                  Watch on YouTube →
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}