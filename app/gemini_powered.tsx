"use client";

import Image from 'next/image';

export default function GeminiPowered() {
    return (
        <div className="mt-8 sm:mt-10 text-center text-gray-600 text-md">
            <p>Powered by</p>
            <Image 
                src="/gemini-logo.svg" 
                alt="Gemini Flash" 
                width={128}  // w-32 = 8rem = 128px
                height={128} // maintaining 1:1 aspect ratio
                className="mx-auto mt-2 sm:w-50"
            />
        </div>
    )
}