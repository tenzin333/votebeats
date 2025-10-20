This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# 🎵 Vote Beats

**Vote Beats** is a collaborative video platform where users can **add, vote, and play videos** in real-time. The system automatically plays the most upvoted video for the creator, turning audience engagement into a dynamic, crowd-driven experience.  

---

## 🚀 Features

-  **Add Videos** — Users can submit YouTube videos to a shared queue.  
-  **Vote System** — Community members upvote their favorite videos.  
-  **Auto Play** — The most upvoted video plays next automatically.  
-  **Smart Ranking** — Video order updates based on live votes.  
-  **Clean UI** — Modern, responsive interface built for creators and viewers.  
-  **Authentication** — Secure user sessions with NextAuth.js.  

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | Next.js (React + TypeScript) |
| **Backend** | Node.js + Prisma ORM |
| **Database** | PostgreSQL / PlanetScale (MySQL) |
| **Auth** | NextAuth.js |
| **Video Player** | YouTube IFrame API |
| **Styling** | Tailwind CSS + shadcn/ui |

---


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
