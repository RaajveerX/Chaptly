import { NextResponse } from 'next/server';
import { AssemblyAI, TranscribeParams } from 'assemblyai';


export async function POST(request: Request) {
    try {
        // Check if API key is configured
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'AssemblyAI API key is not configured' },
                { status: 500 }
            );
        }

        // Initialize AssemblyAI client
        const client = new AssemblyAI({ apiKey });

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        // Validate file existence
        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Validate file type
        const validTypes = [
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
            'video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime'
        ];

        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload an audio or video file.' },
                { status: 400 }
            );
        }

        // Estimate file duration
        const fileSizeInMB = file.size / (1024 * 1024);
        const estimatedMinutes = file.type.startsWith('audio/') 
            ? fileSizeInMB 
            : fileSizeInMB / 10; // Rough estimate for video

        if (estimatedMinutes > 10) {
            return NextResponse.json(
                { error: 'File duration exceeds 10-minute limit' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Modify here //




        // Upload file to AssemblyAI
        const uploadResponse = await client.files.upload(buffer);

        if (!uploadResponse.id) {
            throw new Error('File upload to AssemblyAI failed');
        }

        // Prepare transcription parameters
        const transcribeParams: TranscribeParams = {
            audio: uploadResponse.id,
            speech_model: 'nano',
        };

        // Request transcription
        const transcript = await client.transcripts.transcribe(transcribeParams);

        if (!transcript || !transcript.text) {
            throw new Error('Transcription failed or returned empty text');
        }

        // Return transcription result
        return NextResponse.json(
            {
                message: 'Transcription successful',
                transcript: transcript.text,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Transcription error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: `Failed to process transcription: ${errorMessage}` },
            { status: 500 }
        );
    }
}