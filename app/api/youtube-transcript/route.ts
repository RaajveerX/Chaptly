/* eslint-disable @typescript-eslint/no-explicit-any */
// For Transcript Params, forked supadata's repo to let them know about this issue

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Supadata, Transcript } from '@supadata/js';
// Retrieves the duration of a YouTube video based on the video id
async function getVideoDuration(videoId: string) {
    try {
        const youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY
        });

        const response = await youtube.videos.list({
            part: ['contentDetails'],
            id: [videoId]
        });

        const duration = response.data?.items?.[0]?.contentDetails?.duration;
        if (duration) {
            return parseYouTubeDuration(duration);
        }
        return null;
    } catch (error) {
        console.error('Error fetching video duration:', error);
        return null;
    }
}

// Parses the duration of a YouTube video from ISO 8601 format to seconds
function parseYouTubeDuration(duration: string) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = match[1] ? parseInt(match[1]) * 3600 : 0;
    const minutes = match[2] ? parseInt(match[2]) * 60 : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;

    return hours + minutes + seconds;
}

// Main API route for fetching the transcript and duration of a YouTube video
export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        // Validate YouTube URL
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (!match) {
            return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }
        const videoId = match[1];



        // Initialize the client
        const supadata = new Supadata({
            apiKey: process.env.SUPADATA_KEY as string,
        });

        // Get YouTube transcript from supadata, lifesaver!!!
        const response: Transcript = await supadata.youtube.transcript({
            url: url,
            language: "en",
            text: true,
        } as any); // Type assertion to bypass type checking

        const transcript = response.content; // This is the transcript

        if (!transcript) {
            return NextResponse.json({
                error: 'No transcript available for this video'
            }, { status: 400 });
        }

        // Fetch video duration
        const duration = await getVideoDuration(videoId);

        return NextResponse.json({
            videoId,
            duration,
            transcript
        });

    } catch (error) {
        console.error('Error extracting YouTube transcript:', error);
        return NextResponse.json({
            error: 'Failed to fetch transcript or video duration.'
        }, { status: 500 });
    }
}