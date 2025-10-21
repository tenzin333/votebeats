import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: "Streamer" | "EndUser";
    } &
      DefaultSession["user"];
    };
}


declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role: "Streamer" | "EndUser";
  }
}