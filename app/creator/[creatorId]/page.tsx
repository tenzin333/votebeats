"use client";

import Appbar from "@/components/Appbar";
import Footer from "@/components/Footer";
import StreamView from "@/components/StreamView";
import { notFound } from "next/navigation";
import React from "react";

export default function CreatorPage({ params }: { params: Promise<{ creatorId: string }> }) {

    const resolvedParams = React.use(params);

    if (!resolvedParams?.creatorId) {
        return notFound();
    }

    const { creatorId } = resolvedParams;

    return (
        <div className='flex flex-col px-4 gap-3'>
            <Appbar />
            <StreamView creatorId={creatorId}  playVideo={false}/>
            <Footer />
        </div>
    )
}