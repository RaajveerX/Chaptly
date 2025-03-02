"use client"
import type React from "react"

export function InputFile() {
    return (
        <div className="flex flex-row items-center justify-center gap-2 bg-amber-50">
            <label
                htmlFor="file-upload"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition-all"
            >
                Upload Video/Audio
            </label>

            <input
                id="file-upload"
                type="file"
                className="hidden"
                accept="video/*,audio/*"
            />

            {/* Display file name when uploaded */}
            <div id="file-name" className="text-gray-600 text-center mt-2">
                No file chosen
            </div>
        </div>
    )
}

