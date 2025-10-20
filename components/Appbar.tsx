"use client";

import { LogIn, LogOut, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Appbar() {
  const { data: session } = useSession();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  useEffect(() => {
    if (session?.user) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [session])

  return (
    <nav className="glass border-b border-border/40 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Music className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">VoteBeats</span>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              // <DropdownMenu>
              //   <DropdownMenuTrigger asChild>
              //     <Button variant="ghost" size="icon" className="rounded-full">
              //       <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              //         <User className="w-4 h-4 text-primary" />
              //       </div>
              //     </Button>
              //   </DropdownMenuTrigger>
              //   <DropdownMenuContent align="end" className="w-48">
              //     <DropdownMenuItem>
              //       <User className="w-4 h-4 mr-2" />
              //       Profile
              //     </DropdownMenuItem>
              //     {/* <DropdownMenuItem>My Rooms</DropdownMenuItem> */}
              //     <DropdownMenuSeparator />
              //     <DropdownMenuItem className="text-destructive" onClick={() => signOut()}>
              //       Log out
              //     </DropdownMenuItem>
              //   </DropdownMenuContent>
              // </DropdownMenu>
               <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => signIn()}>
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}