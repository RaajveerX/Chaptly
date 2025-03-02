import { YoutubeTranscript } from 'youtube-transcript';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

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
    // Convert ISO 8601 duration format (PT1H2M30S) to seconds
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

        // Fetch transcript with timestamps
        const transcript = await YoutubeTranscript.fetchTranscript(url, {
            lang: 'en'
        });

        const text = transcript.map(item => item.text).join(' ');

        // Fetch video duration
        const duration = await getVideoDuration(videoId);


        // returned to the frontend, is used by the segment API
        return NextResponse.json({
            videoId,
            duration,  
            transcript: text
        });

    } catch (error) {
        console.error('Error extracting YouTube transcript:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch transcript or video duration.' 
        }, { status: 500 });
    }
}