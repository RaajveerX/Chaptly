import Tiles from './tiles';
import GeminiPowered from '@/app/gemini_powered';

interface CardItem {
  title: string;
  description: string;
  link?: string;  // Made optional since the "Coming Soon" card doesn't have a link
}

export default function Home() {

  const cardData: CardItem[] = [
    { title: "Generate Titles", description: "Titles that make your content impossible to scroll past", link:"/title" },
    { title: "Generate Chapters", description: "AI-powered chapters that keep your audience engaged", link:"/chapter" },
    { title: "Coming Soon", description: "Get Instagram/Tiktok ready shorts in minutes, generated from long-form content" }  // Third card with "Coming Soon"
  ];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen min-w-full bg-gray-100 space-y-8 py-8 px-4 overflow-x-hidden">
      <div className="text-3xl sm:text-4xl text-gray-600 font-bold mt-4">Chaptly</div>
      <p className="text-center text-gray-600 text-base sm:text-lg px-4 max-w-screen-md">Your AI sidekick for content that clicks</p>
      <Tiles cardData={cardData} />
      <GeminiPowered />

      <a 
        href="https://github.com/RaajveerX/Chaptly"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute font-light bottom-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base"
      >
        View Code on GitHub
      </a>

    </div>
  );
}
