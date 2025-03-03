"use server";
import { VertexAI, HarmCategory, HarmBlockThreshold, SchemaType } from "@google-cloud/vertexai";
import { NextResponse } from "next/server";

const getGCPCredentials = () => {
    // for Vercel, use environment variables
    return process.env.GCP_PRIVATE_KEY
      ? {
          credentials: {
            client_email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GCP_PRIVATE_KEY,
          },
          projectId: process.env.GCP_PROJECT_ID,
        }
        // for local development, use gcloud CLI
      : {};
  };

// Function to format time in HH:MM:SS
function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(unit => String(unit).padStart(2, '0')).join(":");
}

// Define the Chapter type
type Chapter = {
    title: string;
    content: string;
}

// Function to generate timestamps based on transcript word positions
async function generate_timestamps(chapters: Chapter[], transcript: string, videoDuration: number) {
    const words = transcript.split(/\s+/);
    const totalWords = words.length;
    
    const timestamps = [];
    let startIndex = 0;

    for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        
        // First chapter always starts at 0
        let startTime;
        if (i === 0) {
            startTime = 0;
        } else {
            const chapterWords = chapter.content.split(/\s+/);
            let matchIndex = -1;
            let wordIndex = 0;
            
            // Keep trying with subsequent words until we find a match
            while (matchIndex === -1 && wordIndex < chapterWords.length) {
                matchIndex = transcript.indexOf(chapterWords[wordIndex], startIndex);
                wordIndex++;
            }
            
            if (matchIndex !== -1) {
                const wordsBefore = transcript.slice(0, matchIndex).split(/\s+/).length;
                startTime = Math.floor((wordsBefore / totalWords) * videoDuration);
                startIndex = matchIndex;  // Update startIndex to the match position
            } else {
                // Fallback if no match is found - estimate based on chapter position
                startTime = Math.floor((i / chapters.length) * videoDuration);
            }
        }

        timestamps.push({
            timestamp: formatTime(startTime),
            title: chapter.title,
            content: chapter.content,
        });
    }

    return timestamps;
}

// Function to generate chapters
async function generate_chapters_from_text_input(transcript: string): Promise<{ chapters: Chapter[] }> {

    const vertexAI = new VertexAI({
        project: process.env.PROJECT_ID as string,
        location: "us-central1",
        googleAuthOptions: getGCPCredentials()
    });


    const generativeModel = vertexAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite-001",
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            },
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
            }
        ],
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    chapters: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                title: { type: SchemaType.STRING },
                                content: { type: SchemaType.STRING },
                            },
                            required: ["title", "content"],
                        },
                    },
                },
            },
        },
    });

    const prompt = `You are a video editor tasked with segmenting a YouTube video transcript into chapters based on topics. 
                    Output must be in valid JSON format with an array of chapters, each containing a title and content.
                    
                    Please follow these steps:
                    1. Carefully analyze the provided YouTube transcript.
                    2. Identify distinct topic shifts within the transcript.
                    3. Create chapter breaks at these topic shifts.
                    4. For each chapter, create a concise title and include the corresponding text.
                    5. Return the result in this exact JSON structure:
                    {
                        "chapters": [
                            {
                                "title": "Chapter Title",
                                "content": "Chapter Content"
                            }
                        ]
                    }

                    Transcript: ${transcript}`;

    try {
        const response = await generativeModel.generateContent(prompt);
        if (!response.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error("Invalid AI response structure");
        }
        const markdownText = response.response.candidates[0].content.parts[0].text;
        const rawJson = markdownText.replace(/```json\n|\n```/g, '');
        
        // Validate JSON structure
        const parsedJson = JSON.parse(rawJson);
        
        if (!parsedJson.chapters || !Array.isArray(parsedJson.chapters) || parsedJson.chapters.length === 0) {
            throw new Error("Invalid AI response: Missing or empty chapters array");
        }

        // Validate each chapter has required properties
        for (const chapter of parsedJson.chapters) {
            if (!chapter.title || !chapter.content || 
                typeof chapter.title !== 'string' || 
                typeof chapter.content !== 'string') {
                throw new Error("Invalid AI response: Chapter missing required properties");
            }
        }

        return parsedJson;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to generate chapters: ${error.message}`);
        }
        throw new Error("Failed to generate chapters: Unknown error");
    }
}

// API Route called by the frontend to generate chapters and timestamps
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const transcript = body["transcript"];
        const videoDuration = body["duration"] // Will always be there

        console.log(`transcript: ${transcript}`);


        // Generates chapters from the transcript, with titles and content
        const chapterData = await generate_chapters_from_text_input(transcript);

        // Generates timestamps for each chapter, based on the transcript and the video duration
        const timestamps = await generate_timestamps(
            chapterData.chapters, //chapterData is a json object, so we need to access the chapters array   
            transcript,
            videoDuration
        );

        return NextResponse.json({ timestamps });

    } catch (error) {
        console.error("Error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
}