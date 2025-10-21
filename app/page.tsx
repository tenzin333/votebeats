import Appbar from "@/components/Appbar";
import { Features } from "@/components/Features";
import { Hero } from "@/components/Hero";
import Footer from "@/components/Footer";
import { getServerSession } from "next-auth";
import { MusicShowcase } from "@/components/MusicShowcase";
import { CTASection } from "@/components/CtaSection";
import StreamView from "@/components/StreamView";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Show landing page if user is not logged in
  if (!session) {
    return (
      <div>
        <Appbar />
        <Hero />
        <Features />
        <MusicShowcase />
        <CTASection />
        <Footer />
      </div>
    );
  }

  // Show dashboard if user is logged in
  return (
    <div className='flex flex-col px-4 gap-3'>
      <Appbar />
      <StreamView   playVideo={true} />
      <Footer />
    </div>
  );
}