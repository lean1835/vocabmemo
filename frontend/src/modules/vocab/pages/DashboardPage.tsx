import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { NotebookTab } from "../components/NotebookTab";
import { FlashcardsTab } from "../components/FlashcardsTab";
import { DifficultTab } from "../components/DifficultTab";
import { OverviewTab } from "../components/OverviewTab";
import { ArchiveTab } from "../components/ArchiveTab";

export const DashboardPage: React.FC = () => {
  const { pathname } = useLocation();

  // Lifted Flashcards Study Session State (Persisted across tab navigation)
  const [studyMode, setStudyMode] = useState<"selection" | "studying">("selection");
  const [selectedStudyType, setSelectedStudyType] = useState<string>("today");
  const [studyFilterModalOpen, setStudyFilterModalOpen] = useState<"date" | "topic" | "level" | null>(null);
  const [studyCardsList, setStudyCardsList] = useState<any[]>([]);
  const [selectedStudyDate, setSelectedStudyDate] = useState<string | undefined>(undefined);
  const [selectedStudyTopic, setSelectedStudyTopic] = useState<string | undefined>(undefined);
  const [selectedStudyLevel, setSelectedStudyLevel] = useState<string | undefined>(undefined);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Dynamic Daily Streak pop-up modal state
  const [streakPopup, setStreakPopup] = useState<{ show: boolean; count: number }>({ show: false, count: 0 });

  const handleStreakUpdated = (count: number) => {
    setStreakPopup({ show: true, count });
    // Tự động đóng sau 4.5 giây
    setTimeout(() => {
      setStreakPopup(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  // Xác định tab hiện tại dựa trên Router Pathname
  const currentTab = useMemo<"notebook" | "flashcards" | "difficult" | "dashboard" | "archive">(() => {
    if (pathname === "/flashcards") return "flashcards";
    if (pathname === "/dashboard") return "dashboard";
    if (pathname === "/difficult") return "difficult";
    if (pathname === "/archive") return "archive";
    return "notebook";
  }, [pathname]);

  return (
    <>
      <DashboardLayout currentTab={currentTab} streakCountOverride={streakPopup.count}>
        {currentTab === "notebook" && <NotebookTab onStreakUpdated={handleStreakUpdated} />}
        {currentTab === "flashcards" && (
          <FlashcardsTab
            studyMode={studyMode}
            setStudyMode={setStudyMode}
            selectedStudyType={selectedStudyType}
            setSelectedStudyType={setSelectedStudyType}
            studyFilterModalOpen={studyFilterModalOpen}
            setStudyFilterModalOpen={setStudyFilterModalOpen}
            studyCardsList={studyCardsList}
            setStudyCardsList={setStudyCardsList}
            selectedStudyDate={selectedStudyDate}
            setSelectedStudyDate={setSelectedStudyDate}
            selectedStudyTopic={selectedStudyTopic}
            setSelectedStudyTopic={setSelectedStudyTopic}
            selectedStudyLevel={selectedStudyLevel}
            setSelectedStudyLevel={setSelectedStudyLevel}
            currentCardIdx={currentCardIdx}
            setCurrentCardIdx={setCurrentCardIdx}
            isCardFlipped={isCardFlipped}
            setIsCardFlipped={setIsCardFlipped}
          />
        )}
        {currentTab === "difficult" && <DifficultTab />}
        {currentTab === "dashboard" && <OverviewTab />}
        {currentTab === "archive" && <ArchiveTab />}
      </DashboardLayout>

      {streakPopup.show && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 select-none cursor-pointer"
          onClick={() => setStreakPopup(prev => ({ ...prev, show: false }))}
        >
          {/* Radial glow background */}
          <div className="absolute inset-0 fire-glow pointer-events-none" />

          {/* Streak Modal Content Container */}
          <div className="relative flex flex-col items-center justify-center p-8 text-center animate-streak-pop max-w-sm w-full mx-4">
            {/* Dynamic Animated Burning Fire SVG */}
            <div className="relative mb-6">
              <svg viewBox="0 0 100 120" className="w-36 h-44 animate-flame-pulsate filter drop-shadow-[0_0_35px_rgba(255,90,0,0.6)]" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="flameBack" x1="50%" y1="100%" x2="50%" y2="0%">
                    <stop offset="0%" stopColor="#ff3300" stopOpacity="0.8"/>
                    <stop offset="50%" stopColor="#ff6600" stopOpacity="0.7"/>
                    <stop offset="100%" stopColor="#ffcc00" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="flameMiddle" x1="50%" y1="100%" x2="50%" y2="0%">
                    <stop offset="0%" stopColor="#ff6600" />
                    <stop offset="60%" stopColor="#ff9900" />
                    <stop offset="100%" stopColor="#ffcc00" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="flameFront" x1="50%" y1="100%" x2="50%" y2="0%">
                    <stop offset="0%" stopColor="#ffcc00" />
                    <stop offset="80%" stopColor="#ffffcc" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path className="animate-flame-rise" style={{ animationDelay: '0s', transformOrigin: 'bottom center' }} d="M50 120 C20 120 10 90 20 60 C30 30 45 10 50 0 C55 10 70 30 80 60 C90 90 80 120 50 120 Z" fill="url(#flameBack)" />
                <path className="animate-flame-rise" style={{ animationDelay: '-0.2s', transformOrigin: 'bottom center' }} d="M50 120 C25 120 18 95 26 70 C34 45 46 20 50 10 C54 20 66 45 74 70 C82 95 75 120 50 120 Z" fill="url(#flameMiddle)" />
                <path className="animate-flame-rise" style={{ animationDelay: '-0.4s', transformOrigin: 'bottom center' }} d="M50 120 C32 120 28 100 32 80 C36 60 48 35 50 25 C52 35 64 60 68 80 C72 100 68 120 50 120 Z" fill="url(#flameFront)" />
              </svg>

              {/* Floating Sparks */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-10 left-1/4 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping opacity-75" style={{ animationDuration: '1.2s' }}></div>
                <div className="absolute bottom-16 right-1/3 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-60" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }}></div>
                <div className="absolute bottom-20 left-1/2 w-1 h-1 bg-yellow-300 rounded-full animate-ping opacity-80" style={{ animationDuration: '0.8s', animationDelay: '0.6s' }}></div>
              </div>
            </div>

            {/* Streak Number with glowing text */}
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 tracking-tighter drop-shadow-[0_4px_12px_rgba(255,90,0,0.3)] mb-2 select-none">
              {streakPopup.count}
            </h1>

            {/* Dynamic Subtitle */}
            <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-2">
              {streakPopup.count > 1 ? "Day Streak!" : "Streak Started!"}
            </h2>

            {/* Motivational message */}
            <p className="text-orange-200/80 text-xs font-bold max-w-xs tracking-wide">
              {streakPopup.count > 1 
                ? "You're on fire! Keep learning every day to keep this streak alive! 🔥"
                : "Awesome start! Log a new word every day to grow your burning streak! 🔥"}
            </p>

            {/* Click to close reminder */}
            <div className="mt-8 text-[9px] uppercase tracking-widest text-slate-500 font-bold">
              Click anywhere to continue
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardPage;
