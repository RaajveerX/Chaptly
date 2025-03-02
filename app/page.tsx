import Tiles from './tiles';
import GeminiPowered from '@/app/gemini_powered';

interface CardItem {
  title: string;
  description: string;
  link?: string;  // Made optional since the "Coming Soon" card doesn't have a link
}

export default function Home() {

  const cardData: CardItem[] = [
    { title: "Generate Titles", description: "Titles that make your video impossible to scroll past", link:"/title" },
    { title: "Generate Chapters", description: "AI-powered chapters that keep your audience engaged", link:"/chapter" },
    { title: "Coming Soon", description: "Get Instagram/Tiktok ready shorts in minutes, generated from long-form content" }  // Third card with "Coming Soon"
  ];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen min-w-full bg-gray-100 space-y-10 py-8 px-4 overflow-x-hidden">
      <div className="text-3xl sm:text-4xl text-gray-600 font-bold mt-4">Chaptly</div>
      <div className="text-center space-y-1 px-4 max-w-screen-lg">
        <p className="text-gray-600 text-base sm:text-lg">
            YouTube videos are more engaging when they feature a catchy title and well-structured topic chapters
        </p>
        <p className="text-gray-600 text-base sm:text-lg">
          Chaptly is your AI sidekick for content that clicks
        </p>
      </div>
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
