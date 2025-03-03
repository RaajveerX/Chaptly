"use server"
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';
import { NextResponse } from 'next/server';

export const getGCPCredentials = () => {
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


// Generates a title from a transcript, using the fine-tuned model
async function generate_from_text_input(transcript: string) {

    const vertexAI = new VertexAI({
        project: process.env.PROJECT_ID as string,
        location: "us-central1",
        googleAuthOptions: getGCPCredentials()
    });

    const generativeModel = vertexAI.getGenerativeModel({
        model: process.env.MODEL_NAME as string,
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
        ]
    });


    const prompt = `You are a "Title Generator Bot" specialized in crafting catchy titles for YouTube videos, podcasts, and similar content. 
    Your goal is to create titles that are fancy, enticing, and encourage clicks.
    Analyze the provided transcript and generate ONE title that accurately reflects the content while being captivating enough to grab attention. 

    The title should be concise, impactful, and create a sense of curiosity or excitement.  Consider using strong verbs, numbers, and questions to make the title more engaging. Aim for a title length that is optimized for search engines and social media platforms.
    Transcript:${transcript}`


    const response = await generativeModel.generateContent(prompt);

    // Check if we have valid candidates
    if (!response.response.candidates || response.response.candidates.length === 0) {
        throw new Error("No valid response generated. The content may have been filtered.");
    }

    const candidate = response.response.candidates[0];

    // Check if the response was filtered
    if (candidate.finishReason === 'SAFETY') {
        throw new Error("The response was filtered due to safety settings.");
    }

    // Check if we have the expected content structure
    if (!candidate.content?.parts?.[0]?.text) {
        throw new Error("Invalid response format from the model.");
    }

    return candidate.content.parts[0].text;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = await generate_from_text_input(body["transcript"]);

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error:', error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
}
