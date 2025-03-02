"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';

const footerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delay: 0.1, duration: 0.2 } }
};

export default function GeminiPowered() {
    return (
        <motion.div
            className="mt-8 sm:mt-10 text-center text-gray-600 text-md"
            initial="hidden"
            animate="visible"
            variants={footerVariants}
        >
            <p>Powered by</p>
            <Image 
                src="/gemini-logo.svg" 
                alt="Gemini Flash" 
                width={128}  // w-32 = 8rem = 128px
                height={128} // maintaining 1:1 aspect ratio
                className="mx-auto mt-2 sm:w-50"
            />
        </motion.div>
    )
}