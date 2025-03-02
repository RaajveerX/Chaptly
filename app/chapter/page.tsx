'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";

export default function Page() {
    

    // State variables for the chapers
    const [generatedChapters, setGeneratedChapters] = useState<{
        timestamps: Array<{
            timestamp: string;
            title: string;
            content: string;
        }>;
    } | null>(null);


    const [youtubeUrl, setYoutubeUrl] = useState(''); // current youtube url in the input field
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [loading, setLoading] = useState(false); //  loading state for button, loader, main pane
    const [processedUrl, setProcessedUrl] = useState(''); // recently processed url
    const [copied, setCopied] = useState(false); // Add state for copy feedback

    // Simplified URL change handler
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setYoutubeUrl(newUrl);
        if (newUrl !== processedUrl) {
            setGeneratedChapters(null);
        }
    };

    // Extract transcript from YouTube video
    const extractYoutubeTranscript = async (url: string) => {

        // Calls the next.js api route to extract the transcript from the youtube video
        try {
            const response = await fetch('/api/youtube-transcript', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch transcript');
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error extracting YouTube transcript:', error);
            return null;
        }
    };

    // Generate Titles by sending transcript to segmentation API
    const generateTitles = async () => {
        if (!youtubeUrl) {
            setAlertMessage("Please enter a YouTube URL.");
            setShowAlert(true);
            return;
        }

        // Validate YouTube URL format
        const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}$/;
        if (!youtubeUrl.match(youtubeUrlRegex)) {
            setAlertMessage("Invalid YouTube URL. Please ensure you're using a valid YouTube video URL (e.g., https://youtube.com/watch?v=... or https://youtu.be/...)");
            setShowAlert(true);
            return;
        }

        setLoading(true);
        const data = await extractYoutubeTranscript(youtubeUrl);
        const transcript = data["transcript"];
        const duration = data["duration"];

        if (!transcript) {
            setAlertMessage("Could not fetch video transcript. This could be because:\n\n• The video doesn't have captions\n• The captions are auto-generated\n• The video is private or age-restricted");
            setShowAlert(true);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/segment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: transcript, duration: duration }),
            });

            if (!response.ok) {
                throw new Error('Segmentation request failed.');
            }

            const data = await response.json();
            setGeneratedChapters(data);
            setProcessedUrl(youtubeUrl);
        } catch (error) {
            setAlertMessage("An error occurred while generating the chapters. Please try again later.");
            console.error("Error generating chapters:", error);
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    // Add this new function to handle copying
    const handleCopy = () => {
        if (!generatedChapters) return;
        
        const chaptersText = generatedChapters.timestamps
            .map(segment => `${segment.timestamp} ${segment.title}`)
            .join('\n');
        
        navigator.clipboard.writeText(chaptersText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 space-y-10">
            <Link href={"/"}>
                <Button variant="outline" className="absolute top-5 left-5" size="icon">
                    <ChevronLeft />
                </Button>
            </Link>
            <div className="text-4xl text-gray-600 font-bold my-10 text-center">Chapter Generator</div>

            {/* Box to show generated titles, Client Component */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } }}
                className="w-10/12 h-100 p-6 bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col justify-center items-center overflow-y-auto">

                {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                        <div className='loader'></div>
                        <span className="text-gray-500">Segmenting video...</span>
                    </div>
                ) : !generatedChapters ? (
                    <div className="text-gray-400 text-center">Generated chapters will appear here.</div>
                ) : (
                    <div className="h-full w-full overflow-y-auto">
                        <div className="flex justify-end mb-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopy}
                                className="flex items-center gap-2"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy All
                                    </>
                                )}
                            </Button>
                        </div>
                        {generatedChapters.timestamps.map((segment, segmentIndex) => (
                            <div key={segmentIndex} className="flex flex-col p-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm mb-4">
                                <div className="font-medium text-md mb-2">{segment.title}</div>
                                <div className="text-sm text-gray-500 mb-2">
                                    Timestamp: {segment.timestamp}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Input Section, Client Component */}
            <div className="w-9/12 flex flex-row justify-center space-x-6">
                {/* URL section, Client Component */}
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="youtube-url" className='pl-1'>{(youtubeUrl !== "" && youtubeUrl ==  processedUrl)? "URL already processed": "Enter YouTube URL"}</Label>
                    <Input 
                        id="youtube-url" 
                        type="text" 
                        className='border-gray-600' 
                        placeholder="Paste URL here" 
                        value={youtubeUrl} 
                        onChange={handleUrlChange}
                    />
                </div>

                {/* Generate Button, Client Component */}
                <Button 
                    className='self-end' 
                    variant="outline" 
                    onClick={generateTitles}  
                    disabled={loading || (youtubeUrl !== "" && youtubeUrl ==  processedUrl)}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate Chapters"}
                </Button>
            </div>

            {/* Alert Dialog for Errors, Client Component */}
            <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Error</AlertDialogTitle>
                        <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button className="bg-gray-600" onClick={() => setShowAlert(false)}>OK</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Disclaimer */}
            <p className="text-center text-gray-600 text-sm mt-6">We do not store any data. We can&apos;t afford storage.</p>
        </div>
    );
}