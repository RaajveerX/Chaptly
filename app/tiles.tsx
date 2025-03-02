'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';

interface CardItem {
    title: string;
    description: string;
    link?: string;  // Made optional since the "Coming Soon" card doesn't have a link
}

export default function Tiles({ cardData }: { cardData: CardItem[] }) {
    return (
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 w-full max-w-screen-lg px-4">
            {cardData.map((card, i) => (
                <div
                    key={i}
                    className="flex-1"
                >
                    <Link href={card.title === "Coming Soon" ? "#" : card.link as string} className="block h-full">
                        <Card
                            className={`h-full bg-white border border-gray-300 flex flex-col items-center justify-center rounded-lg shadow-lg p-6 cursor-pointer hover:bg-gray-200 transition ${card.title === "Coming Soon" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                        >
                            <h2 className={`text-lg font-semibold text-gray-700 mb-2 text-center ${card.title === "Coming Soon" ? "text-gray-500" : ""}`}>
                                {card.title}
                            </h2>
                            <p className="text-sm text-gray-500 text-center px-4">{card.description}</p>
                        </Card>
                    </Link>
                </div>
            ))}
        </div>
    )
}