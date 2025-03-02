'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { Copy } from "lucide-react";
import ytdl from 'ytdl-core';

export default function Page() {

    // State variables for the titles
    const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
    const [youtubeUrl, setYoutubeUrl] = useState(''); // current youtube url in the input field
    const [showAlert, setShowAlert] = useState(false); // alert state for errors
    const [alertMessage, setAlertMessage] = useState(''); // alert message for errors
    const [loading, setLoading] = useState(false); // loading state for button, loader, main pane

    // Simplified URL change handler
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setYoutubeUrl(e.target.value);
    };

    // Extract transcript from YouTube video
    const extractYoutubeTranscript = async (url: string) => {
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

    // Generate Titles by sending transcript to the predict api route
    const generateTitles = async () => {

        // Check if the user has reached the maximum limit of 5 titles
        if (generatedTitles.length >= 5) {
            setAlertMessage("You've reached the maximum limit of 5 titles. Please refresh the page to start over.");
            setShowAlert(true);
            return;
        }

        // Check if the user has entered a YouTube URL
        if (!youtubeUrl) {
            setAlertMessage("Please enter a YouTube URL.");
            setShowAlert(true);
            return;
        }

        // Validate YouTube URL using ytdl-core
        if (!ytdl.validateURL(youtubeUrl)) {
            setAlertMessage("Invalid YouTube URL. Please ensure you're using a valid YouTube video URL.");
            setShowAlert(true);
            return;
        }

        setLoading(true); // to show the fancy loader
        const transcriptData = await extractYoutubeTranscript(youtubeUrl);

        if (!transcriptData) {
            setAlertMessage("Could not fetch video transcript. This could be because:\n\n• The transcript is not in English\n• The video doesn't have captions\n• The captions are auto-generated\n• The video is private or age-restricted");
            setShowAlert(true);
            setLoading(false);
            return;
        }

        try {
            
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: transcriptData.transcript }),
            });

            if (!response.ok) {
                throw new Error('Prediction request failed.');
            }

            const data = await response.json();
            console.log(`data from generate titles: ${data}`);
            setGeneratedTitles(prev => [...prev, data]);
        } catch (error) {
            setAlertMessage("An error occurred while generating the title. Please try again later.");
            console.error("Error generating titles:", error);
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    // Add this new function to handle copying
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 space-y-10">

            {/* Back button */}
            <Link href={"/"}>
                <Button variant="outline" className="absolute top-5 left-5" size="icon">
                    <ChevronLeft />
                </Button>
            </Link>
            <div className="text-4xl text-gray-600 font-bold my-10 text-center">Title Generator</div>

            {/* Box to show generated titles */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } }}
                className="w-10/12 h-100 p-6 bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col justify-center items-center overflow-y-auto">

                {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                        <div className='loader'></div>
                        <span className="text-gray-500">Generating titles... (longer videos may take over a minute)</span>
                    </div>
                ) : generatedTitles.length === 0 ? (
                    <div className="text-gray-400 text-center">Generated titles will appear here.</div>
                ) : (
                    <div className="space-y-4 w-full h-full overflow-y-auto">
                        {generatedTitles.map((title, index) => (
                            <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm flex justify-between items-center">
                                <span>{title}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyToClipboard(title)}
                                    className="h-8 w-8"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Input Section */}
            <div className="w-9/12 flex flex-row justify-center space-x-6">
                {/* URL section */}
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="youtube-url" className='pl-1'>{generatedTitles.length >= 5 ? "Max limit of 5 titles. Please refresh the page." : "Enter YouTube URL"}</Label>
                    <Input 
                        id="youtube-url" 
                        type="text" 
                        className='border-gray-600' 
                        placeholder="Paste URL here" 
                        value={youtubeUrl} 
                        onChange={handleUrlChange}
                        disabled={generatedTitles.length >= 5}
                    />
                </div>

                {/* Generate Button */}
                <Button 
                    className='self-end' 
                    variant="outline" 
                    onClick={generateTitles} 
                    disabled={loading || generatedTitles.length >= 5}
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : generatedTitles.length > 0 ? (
                        "Generate Another Title"
                    ) : (
                        "Generate Title"
                    )}
                </Button>
            </div>

            {/* Alert Dialog for Errors */}
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