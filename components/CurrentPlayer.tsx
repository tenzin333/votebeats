"use client";

import { Clock, Music, SkipForward, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface CurrentPlayingProps {
  currentStream: any;
  playVideo: boolean;
  setCurrentStream: any;
}

export default function CurrentPlaying({
  currentStream,
  playVideo,
  setCurrentStream,
}: CurrentPlayingProps) {
  const [progress, setProgress] = useState(0);
  const [playNextLoader, setPlayNextLoader] = useState<boolean>(false);
  const { data: session } = useSession();
  const playerRef = useRef<any>(null);

  // Load YouTube IFrame API and handle video changes
  useEffect(() => {
    if (!currentStream?.extractedId) return;

    function createPlayer() {
      playerRef.current = new (window as any).YT.Player("youtube-player", {
        videoId: currentStream.extractedId,
        events: {
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) {
              handleStreamNext();
            }
          },
        },
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
        },
      });
    }

    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    } else {
      if (!playerRef.current) {
        createPlayer();
      } else {
        // Load new video if player exists
        playerRef.current.loadVideoById(currentStream.extractedId);
      }
    }
  }, [currentStream]);

  const fetchMostUpvotedStream = async () => {
    try {
      setPlayNextLoader(true);
      const res = await axios.get("/api/streams/next");
      console.log(res.data.stream);
      setCurrentStream(res.data.stream);
    } catch (err) {
      console.error(err);
    } finally {
      setPlayNextLoader(false);
    }
  };

  const handleStreamNext = () => {
    fetchMostUpvotedStream();
  };

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
              </div>
            </div>
            <div className="p-3">
              <div className="text-center py-4">
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
                <Button className="ghost" onClick={handleStreamNext}>
                  <SkipForward className="w-4 h-4" />
                  Play Next
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden shadow-xl max-w-full">
      <CardContent className="p-0">
        <div className="relative">
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

            {progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50">
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          <div className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 mr-2">
                <h2 className="text-base font-bold mb-0.5 truncate">
                  {currentStream.title || "Unknown Title"}
                </h2>
                <p className="text-muted-foreground text-xs truncate">
                  {currentStream.type || "YouTube"}
                </p>
              </div>
              <div className="flex flex-col items-center gap-0.5 bg-secondary/50 px-4 py-1.5 rounded-md border border-border shrink-0">
                <div className="flex items-center gap-3">
                  <ThumbsUp className="w-4 h-4 text-primary" />
                  <span className="text-base font-bold">
                    {currentStream.upvotes ||
                      currentStream.votes ||
                      currentStream._count?.upvotes ||
                      0}
                  </span>
                </div>
                <span className="text-[9px] text-muted-foreground">votes</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Avatar className="w-4 h-4">
                  <AvatarFallback className="bg-primary/20 text-primary text-[8px]">
                    {currentStream.addedBy?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span>{currentStream.addedBy || "Unknown"}</span>
              </div>
              {currentStream.duration && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <div className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{currentStream.duration}</span>
                  </div>
                </>
              )}
            </div>

            {progress > 0 && (
              <div className="mb-2">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Click to play video</span>
              {currentStream.extractedId && (
                <Link
                  href={`https://www.youtube.com/watch?v=${currentStream.extractedId}?autoplay=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Watch on YouTube
                </Link>
              )}
            </div>

            {playVideo && (
              <div className="py-3">
                <Button
                  className="ghost"
                  onClick={handleStreamNext}
                  disabled={playNextLoader}
                >
                  <SkipForward className="w-4 h-4" />
                  {playNextLoader ? "Loading..." : "Play Next"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
