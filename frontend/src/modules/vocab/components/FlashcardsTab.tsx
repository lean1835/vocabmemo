import React, { useMemo, useEffect } from "react";
import { Button, Select, Modal, notification } from "antd";
import {
  RadarChartOutlined,
  CalendarOutlined,
  HistoryOutlined,
  TagOutlined,
  BarChartOutlined,
  SyncOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  SoundOutlined,
  EyeOutlined,
  CloseOutlined,
  FireOutlined,
  CheckOutlined,
  FrownOutlined,
  SmileOutlined
} from "@ant-design/icons";
import { playVocabSpeech } from "../services/tts";
import { useGetVocabsQuery, useUpdateVocabMutation } from "../services/vocabApi";

interface FlashcardsTabProps {
  studyMode: "selection" | "studying";
  setStudyMode: React.Dispatch<React.SetStateAction<"selection" | "studying">>;
  selectedStudyType: string;
  setSelectedStudyType: React.Dispatch<React.SetStateAction<string>>;
  studyFilterModalOpen: "date" | "topic" | "level" | null;
  setStudyFilterModalOpen: React.Dispatch<React.SetStateAction<"date" | "topic" | "level" | null>>;
  studyCardsList: any[];
  setStudyCardsList: React.Dispatch<React.SetStateAction<any[]>>;
  selectedStudyDate: string | undefined;
  setSelectedStudyDate: React.Dispatch<React.SetStateAction<string | undefined>>;
  selectedStudyTopic: string | undefined;
  setSelectedStudyTopic: React.Dispatch<React.SetStateAction<string | undefined>>;
  selectedStudyLevel: string | undefined;
  setSelectedStudyLevel: React.Dispatch<React.SetStateAction<string | undefined>>;
  currentCardIdx: number;
  setCurrentCardIdx: React.Dispatch<React.SetStateAction<number>>;
  isCardFlipped: boolean;
  setIsCardFlipped: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FlashcardsTab: React.FC<FlashcardsTabProps> = ({
  studyMode,
  setStudyMode,
  selectedStudyType,
  setSelectedStudyType,
  studyFilterModalOpen,
  setStudyFilterModalOpen,
  studyCardsList,
  setStudyCardsList,
  selectedStudyDate,
  setSelectedStudyDate,
  selectedStudyTopic,
  setSelectedStudyTopic,
  selectedStudyLevel,
  setSelectedStudyLevel,
  currentCardIdx,
  setCurrentCardIdx,
  isCardFlipped,
  setIsCardFlipped
}) => {

  // API calls
  const { data: vocabsData } = useGetVocabsQuery({
    page: 1,
    limit: 100
  });
  const [updateVocab] = useUpdateVocabMutation();

  const difficultCount = useMemo(() => {
    return vocabsData?.data?.filter((v: any) => v.isDifficult).length || 0;
  }, [vocabsData]);

  // Tự động phát âm khi vào thẻ học hoặc chuyển từ tiếp theo
  useEffect(() => {
    if (studyMode === "studying" && studyCardsList[currentCardIdx]) {
      playVocabSpeech(studyCardsList[currentCardIdx].correctedWord, "en-US");
    }
  }, [currentCardIdx, studyMode, studyCardsList]);

  // Lấy danh sách các ngày học duy nhất có chứa từ vựng
  const uniqueDatesList = useMemo(() => {
    if (!vocabsData?.data) return [];
    const dates = vocabsData.data.map((v: any) => {
      const d = new Date(v.createdAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
    return Array.from(new Set(dates)).sort((a: any, b: any) => b.localeCompare(a)) as string[];
  }, [vocabsData]);

  const isPartOfSpeechTag = (tag: string): boolean => {
    if (!tag) return false;
    const t = tag.toLowerCase().trim();
    const posTerms = [
      "noun", "verb", "adjective", "adverb", "adj", "adv", "pronoun", "preposition", "conjunction", "interjection",
      "danh từ", "động từ", "tính từ", "trạng từ", "danh tu", "dong tu", "tinh tu", "trang tu",
      "danh", "động", "tính", "trạng", "dong", "tinh", "trang"
    ];
    return posTerms.includes(t);
  };

  // Lấy danh sách các tag duy nhất thực tế có trong sổ tay (loại trừ từ loại)
  const uniqueTagsList = useMemo(() => {
    if (!vocabsData?.data) return [];
    const tagsSet = new Set<string>();
    vocabsData.data.forEach((v: any) => {
      if (v.tags && Array.isArray(v.tags)) {
        v.tags.forEach((tag: string) => {
          if (tag && !isPartOfSpeechTag(tag)) tagsSet.add(tag);
        });
      }
    });
    return Array.from(tagsSet).sort() as string[];
  }, [vocabsData]);

  // Lấy danh sách các level duy nhất thực tế có trong sổ tay
  const uniqueLevelsList = useMemo(() => {
    if (!vocabsData?.data) return [];
    const levelsSet = new Set<string>();
    vocabsData.data.forEach((v: any) => {
      if (v.level) {
        levelsSet.add(v.level.toUpperCase());
      }
    });
    return Array.from(levelsSet).sort() as string[];
  }, [vocabsData]);

  // Tạo nhãn mốc ngày thân thiện tiếng Anh
  const getFriendlyDateLabel = (dateStr: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    if (dateStr === todayStr) return "Today";
    if (dateStr === yesterdayStr) return "Yesterday";

    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }
    return dateStr;
  };

  // Định dạng in đậm từ khóa trong ví dụ (Không dùng ngoặc vuông khi render)
  const formatExampleSentence = (sentence: string, targetWord: string) => {
    if (!sentence) return "";
    let cleanSentence = sentence.replace(/[\[\]]/g, "");
    const regex = new RegExp(`\\b(${targetWord}|${targetWord}s|${targetWord}ed|${targetWord}ing)\\b`, "gi");
    return cleanSentence.replace(regex, `<span class="font-black text-slate-800 dark:text-white">$1</span>`);
  };

  const getShorthandPOS = (pos: string) => {
    const cleanPos = pos?.toLowerCase().trim();
    if (cleanPos?.includes("noun")) return "NOUN";
    if (cleanPos?.includes("verb")) return "VERB";
    if (cleanPos?.includes("adjective") || cleanPos?.includes("adj")) return "ADJECTIVE";
    if (cleanPos?.includes("adverb") || cleanPos?.includes("adv")) return "ADVERB";
    return pos?.toUpperCase();
  };

  const getLevelBadgeColor = (level: string) => {
    const l = level?.toUpperCase().trim();
    if (l === "A1" || l === "A2") {
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/40";
    }
    if (l === "B1" || l === "B2") {
      return "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/40";
    }
    if (l === "C1" || l === "C2") {
      return "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/40";
    }
    return "bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border border-gray-100 dark:border-slate-800";
  };

  // Bắt đầu học Flashcards
  const handleStartFlashcards = () => {
    if (!vocabsData?.data || vocabsData.data.length === 0) {
      notification.warning({
        message: "Sổ tay trống",
        description: "Vui lòng thêm từ vựng vào notebook trước khi luyện tập.",
        placement: "topRight"
      });
      return;
    }

    if (selectedStudyType === "today") {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const filtered = vocabsData.data.filter((v: any) => {
        const d = new Date(v.createdAt);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return dStr === todayStr;
      });

      if (filtered.length === 0) {
        notification.info({
          message: "Không có từ mới hôm nay",
          description: "Hệ thống sẽ ôn tập toàn bộ từ vựng hiện có.",
          placement: "topRight"
        });
        setStudyCardsList(vocabsData.data);
      } else {
        setStudyCardsList(filtered);
      }
      setStudyMode("studying");
      setCurrentCardIdx(0);
      setIsCardFlipped(false);
    } else if (selectedStudyType === "all") {
      setStudyCardsList(vocabsData.data);
      setStudyMode("studying");
      setCurrentCardIdx(0);
      setIsCardFlipped(false);
    } else if (selectedStudyType === "difficult") {
      const filtered = vocabsData.data.filter((v: any) => v.isDifficult === true);
      if (filtered.length === 0) {
        notification.warning({
          message: "Danh sách trống",
          description: "Bạn chưa đánh dấu từ vựng nào là hay quên/khó học.",
          placement: "topRight"
        });
        return;
      }
      setStudyCardsList(filtered);
      setStudyMode("studying");
      setCurrentCardIdx(0);
      setIsCardFlipped(false);
    } else if (selectedStudyType === "date") {
      setSelectedStudyDate(undefined);
      setStudyFilterModalOpen("date");
    } else if (selectedStudyType === "topic") {
      setSelectedStudyTopic(undefined);
      setStudyFilterModalOpen("topic");
    } else if (selectedStudyType === "level") {
      setSelectedStudyLevel(undefined);
      setStudyFilterModalOpen("level");
    }
  };

  // Các hàm xác nhận lọc
  const handleConfirmDateStudy = () => {
    if (!selectedStudyDate) {
      notification.warning({
        message: "Chưa chọn ngày",
        description: "Vui lòng chọn một ngày để bắt đầu học.",
        placement: "topRight"
      });
      return;
    }
    const filtered = vocabsData.data.filter((v: any) => {
      const d = new Date(v.createdAt);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return dStr === selectedStudyDate;
    });

    if (filtered.length === 0) {
      notification.warning({
        message: "Không tìm thấy từ vựng",
        description: "Ngày đã chọn không có từ vựng nào để học.",
        placement: "topRight"
      });
      return;
    }

    setStudyCardsList(filtered);
    setStudyFilterModalOpen(null);
    setStudyMode("studying");
    setCurrentCardIdx(0);
    setIsCardFlipped(false);
  };

  const handleConfirmTopicStudy = () => {
    if (!selectedStudyTopic) {
      notification.warning({
        message: "Chưa chọn chủ đề",
        description: "Vui lòng chọn một chủ đề để bắt đầu học.",
        placement: "topRight"
      });
      return;
    }
    const filtered = vocabsData.data.filter((v: any) =>
      v.tags && Array.isArray(v.tags) && v.tags.includes(selectedStudyTopic)
    );

    if (filtered.length === 0) {
      notification.warning({
        message: "Không tìm thấy từ vựng",
        description: "Chủ đề đã chọn không có từ vựng nào để học.",
        placement: "topRight"
      });
      return;
    }

    setStudyCardsList(filtered);
    setStudyFilterModalOpen(null);
    setStudyMode("studying");
    setCurrentCardIdx(0);
    setIsCardFlipped(false);
  };

  const handleConfirmLevelStudy = () => {
    if (!selectedStudyLevel) {
      notification.warning({
        message: "Chưa chọn mức độ",
        description: "Vui lòng chọn một mức độ để bắt đầu học.",
        placement: "topRight"
      });
      return;
    }
    const filtered = vocabsData.data.filter((v: any) =>
      v.level && v.level.toUpperCase() === selectedStudyLevel.toUpperCase()
    );

    if (filtered.length === 0) {
      notification.warning({
        message: "Không tìm thấy từ vựng",
        description: "Mức độ đã chọn không có từ vựng nào để học.",
        placement: "topRight"
      });
      return;
    }

    setStudyCardsList(filtered);
    setStudyFilterModalOpen(null);
    setStudyMode("studying");
    setCurrentCardIdx(0);
    setIsCardFlipped(false);
  };

  const handleCardClick = () => {
    setIsCardFlipped((prev) => !prev);
  };

  return (
    <div className="max-w-3xl mx-auto w-full pt-6">

      {/* STATE 1: SELECTION SCREEN */}
      {studyMode === "selection" && (
        <div className="space-y-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-3xl flex items-center justify-center mb-1">
            <RadarChartOutlined className="text-[#0056b3] text-2xl" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Ready for a study session?</h2>
            <p className="text-slate-400 text-xs font-semibold">Choose how you want to focus your review today.</p>
          </div>

          {/* Options Selection List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
            
            {/* Today's Words */}
            <div
              onClick={() => setSelectedStudyType("today")}
              className={`p-5 rounded-2xl border cursor-pointer bg-white dark:bg-[#1c1c1e] transition-all duration-300 ${
                selectedStudyType === "today"
                  ? "border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/5 dark:bg-blue-950/10 shadow-sm scale-[1.01]"
                  : "border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors duration-300 ${
                  selectedStudyType === "today"
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-gray-100 dark:border-slate-800"
                }`}>
                  <CalendarOutlined className="text-xs" />
                </div>
                <h4 className="text-xs font-black text-slate-800 dark:text-white">
                  Today's Words
                </h4>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">
                Review words scheduled for today by the spaced repetition algorithm.
              </p>
            </div>

            {/* By Date */}
            <div
              onClick={() => setSelectedStudyType("date")}
              className={`p-5 rounded-2xl border cursor-pointer bg-white dark:bg-[#1c1c1e] transition-all duration-300 ${
                selectedStudyType === "date"
                  ? "border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/5 dark:bg-indigo-950/10 shadow-sm scale-[1.01]"
                  : "border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors duration-300 ${
                  selectedStudyType === "date"
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-gray-100 dark:border-slate-800"
                }`}>
                  <HistoryOutlined className="text-xs" />
                </div>
                <h4 className="text-xs font-black text-slate-800 dark:text-white">
                  By Date
                </h4>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">
                Focus on words added during a specific timeframe or recent lessons.
              </p>
            </div>

            {/* By Topic */}
            <div
              onClick={() => setSelectedStudyType("topic")}
              className={`p-5 rounded-2xl border cursor-pointer bg-white dark:bg-[#1c1c1e] transition-all duration-300 ${
                selectedStudyType === "topic"
                  ? "border-purple-500 dark:border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/5 dark:bg-purple-950/10 shadow-sm scale-[1.01]"
                  : "border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors duration-300 ${
                  selectedStudyType === "topic"
                    ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-gray-100 dark:border-slate-800"
                }`}>
                  <TagOutlined className="text-xs" />
                </div>
                <h4 className="text-xs font-black text-slate-800 dark:text-white">
                  By Topic
                </h4>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">
                Review vocabulary grouped by tags like 'Travel', 'Food', or custom sets.
              </p>
            </div>

            {/* By Level */}
            <div
              onClick={() => setSelectedStudyType("level")}
              className={`p-5 rounded-2xl border cursor-pointer bg-white dark:bg-[#1c1c1e] transition-all duration-300 ${
                selectedStudyType === "level"
                  ? "border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/10 shadow-sm scale-[1.01]"
                  : "border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors duration-300 ${
                  selectedStudyType === "level"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-gray-100 dark:border-slate-800"
                }`}>
                  <BarChartOutlined className="text-xs" />
                </div>
                <h4 className="text-xs font-black text-slate-800 dark:text-white">
                  By Level
                </h4>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">
                Target specific difficulty tiers or CEFR levels in your collection.
              </p>
            </div>

            {/* Difficult Words */}
            <div
              onClick={() => setSelectedStudyType("difficult")}
              className={`p-5 rounded-2xl border cursor-pointer bg-white dark:bg-[#1c1c1e] transition-all duration-300 ${
                selectedStudyType === "difficult"
                  ? "border-red-500 dark:border-red-500 ring-2 ring-red-500/20 bg-red-50/5 dark:bg-red-950/10 shadow-sm scale-[1.01]"
                  : "border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors duration-300 ${
                  selectedStudyType === "difficult"
                    ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-gray-100 dark:border-slate-800"
                }`}>
                  <FireOutlined className="text-xs" />
                </div>
                <h4 className="text-xs font-black flex items-center gap-1.5 text-slate-800 dark:text-white">
                  <span>Difficult Words</span>
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {difficultCount}
                  </span>
                </h4>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">
                Review words that you find hard to remember or marked as difficult.
              </p>
            </div>

            {/* Study All */}
            <div
              onClick={() => setSelectedStudyType("all")}
              className={`p-5 rounded-2xl border cursor-pointer bg-white dark:bg-[#1c1c1e] transition-all duration-300 ${
                selectedStudyType === "all"
                  ? "border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/5 dark:bg-amber-950/10 shadow-sm scale-[1.01]"
                  : "border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors duration-300 ${
                  selectedStudyType === "all"
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-gray-100 dark:border-slate-800"
                }`}>
                  <SyncOutlined className="text-xs" />
                </div>
                <h4 className="text-xs font-black text-slate-800 dark:text-white">
                  Study All
                </h4>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">
                A comprehensive review of your entire vocabulary notebook.
              </p>
            </div>
          </div>

          {/* Start Session Trigger */}
          <div className="pt-4 w-full flex justify-center">
            <Button
              type="primary"
              onClick={handleStartFlashcards}
              className="bg-[#0056b3] hover:bg-blue-700 border-none rounded-xl font-bold h-12 px-10 text-xs shadow-md shadow-blue-500/10 flex items-center gap-2"
            >
              <span>Start Session</span>
              <ArrowRightOutlined />
            </Button>
          </div>
        </div>
      )}

      {/* STATE 2: ACTIVE STUDY FLIP SESSION */}
      {studyMode === "studying" && (
        <div className="space-y-6">
          
          {/* Progress Header */}
          <div className="flex justify-between items-center text-xs font-black text-slate-500 px-1">
            <span>Advanced Vocabulary Study</span>
            <span>{currentCardIdx + 1} / {studyCardsList.length || 1} words</span>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full h-1 bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${((currentCardIdx + 1) / (studyCardsList.length || 1)) * 100}%` }}
            />
          </div>

          {/* FLIP FLASHCARD SHEET */}
          {studyCardsList[currentCardIdx] && (
            <div className="space-y-8 flex flex-col items-center">
              {/* 3D Flip Card Container with equal size front and back */}
              <div className="card-flip-container select-none" onClick={handleCardClick}>
                <div className={`card-flip-inner ${isCardFlipped ? 'card-flipped' : ''}`}>
                  
                  {/* FRONT SIDE */}
                  <div
                    className="card-flip-front bg-white dark:bg-[#1c1c1e] rounded-3xl border border-gray-200/50 dark:border-slate-800/80 shadow-md p-8 flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden"
                  >
                    {studyCardsList[currentCardIdx].isDifficult && (
                      <div className="absolute left-4 top-4 text-red-500 bg-red-50 dark:bg-slate-900 border border-red-100/50 dark:border-slate-800 rounded-full w-7 h-7 flex items-center justify-center shadow-sm">
                        <FireOutlined className="text-xs" />
                      </div>
                    )}

                    <div className="absolute right-4 top-4 text-slate-300">
                      <PlusOutlined className="text-sm font-semibold opacity-30" />
                    </div>

                    <div className="space-y-3">
                      <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                        {studyCardsList[currentCardIdx].correctedWord}
                      </h2>
                      {studyCardsList[currentCardIdx].pronunciationUK && (
                        <p className="text-slate-400 text-xs font-bold italic">
                          {studyCardsList[currentCardIdx].pronunciationUK}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div
                    className="card-flip-back bg-white dark:bg-[#1c1c1e] rounded-3xl border border-gray-200/50 dark:border-slate-800/80 shadow-md p-8 flex flex-col justify-between cursor-pointer relative overflow-y-auto"
                  >
                    <div className="text-left space-y-4 w-full">
                      
                      {/* Top Row: Word, speaker, ipa, level, category */}
                      <div className="flex items-center flex-wrap gap-2 w-full">
                        <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                          {studyCardsList[currentCardIdx].correctedWord}
                        </span>
                        
                        <Button
                          type="text"
                          shape="circle"
                          size="small"
                          icon={<SoundOutlined className="text-slate-400 hover:text-blue-600 text-xs" />}
                          onClick={(e) => { e.stopPropagation(); playVocabSpeech(studyCardsList[currentCardIdx].correctedWord, "en-US"); }}
                          className="flex items-center justify-center bg-slate-50 dark:bg-slate-800"
                        />

                        {studyCardsList[currentCardIdx].pronunciationUK && (
                          <span className="text-xs font-semibold text-slate-400">
                            {studyCardsList[currentCardIdx].pronunciationUK}
                          </span>
                        )}

                        {/* Topic Hashtags badges */}
                        <div className="flex items-center gap-1.5 ml-2">
                          {studyCardsList[currentCardIdx].tags && studyCardsList[currentCardIdx].tags.filter((t: string) => !isPartOfSpeechTag(t)).map((tag: string) => (
                            <span key={tag} className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-slate-900 border border-indigo-100/40 dark:border-indigo-800/40 px-2 py-0.5 rounded-full uppercase">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Part of Speech & Level Ribbons Row */}
                      {(studyCardsList[currentCardIdx].partOfSpeech || studyCardsList[currentCardIdx].level) && (
                        <div className="flex items-center gap-2">
                          {studyCardsList[currentCardIdx].partOfSpeech && (
                            <div className="w-fit bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase">
                              {getShorthandPOS(studyCardsList[currentCardIdx].partOfSpeech)}
                            </div>
                          )}
                          {studyCardsList[currentCardIdx].level && (
                            <div className={`w-fit px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${getLevelBadgeColor(studyCardsList[currentCardIdx].level)}`}>
                              {studyCardsList[currentCardIdx].level.toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Translations */}
                      <div className="space-y-1.5">
                        <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold leading-relaxed mb-0">
                          {studyCardsList[currentCardIdx].meaningVi}
                        </p>
                        {studyCardsList[currentCardIdx].meaningEn && (
                          <p className="text-slate-400 text-xs italic font-medium mb-0">
                            {studyCardsList[currentCardIdx].meaningEn}
                          </p>
                        )}
                      </div>

                      {/* Examples section with vertical blue border on left */}
                      {studyCardsList[currentCardIdx].examples?.length > 0 && (
                        <div className="border-l-2 border-blue-500 pl-4 py-1 space-y-3 bg-slate-50/20 dark:bg-slate-900/10 rounded-r-xl">
                          {studyCardsList[currentCardIdx].examples.map((item: any, idx: number) => (
                            <div key={idx} className="space-y-0.5 text-xs text-left">
                              <p
                                className="text-slate-700 dark:text-slate-300 font-semibold mb-0"
                                dangerouslySetInnerHTML={{ __html: formatExampleSentence(item.sentence, studyCardsList[currentCardIdx].correctedWord) }}
                              />
                              <p className="text-slate-400 text-[10px] font-bold mb-0">
                                {item.translation}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Easy/Hard Marker Buttons */}
                      <div className="pt-4 mt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-4 w-full shrink-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Đánh giá từ
                        </span>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const card = studyCardsList[currentCardIdx];
                              try {
                                await updateVocab({ id: card._id, body: { isDifficult: false } }).unwrap();
                                const updatedList = [...studyCardsList];
                                updatedList[currentCardIdx] = { ...card, isDifficult: false };
                                setStudyCardsList(updatedList);
                                notification.success({
                                  message: "Đã đánh dấu Dễ",
                                  description: `Từ "${card.correctedWord}" đã được chuyển thành Dễ học.`,
                                  placement: "topRight",
                                  duration: 2
                                });
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border flex items-center gap-1.5 transition-all ${
                              studyCardsList[currentCardIdx].isDifficult === false || !studyCardsList[currentCardIdx].isDifficult
                                ? "bg-emerald-500 text-white border-none shadow-sm shadow-emerald-500/20"
                                : "bg-slate-50 dark:bg-slate-900 text-slate-500 border-gray-200 dark:border-slate-800 hover:bg-emerald-50 hover:text-emerald-500"
                            }`}
                          >
                            <SmileOutlined className="text-xs" />
                            <span>Easy (Dễ)</span>
                          </button>

                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const card = studyCardsList[currentCardIdx];
                              try {
                                await updateVocab({ id: card._id, body: { isDifficult: true } }).unwrap();
                                const updatedList = [...studyCardsList];
                                updatedList[currentCardIdx] = { ...card, isDifficult: true };
                                setStudyCardsList(updatedList);
                                notification.success({
                                  message: "Đã đánh dấu Khó",
                                  description: `Từ "${card.correctedWord}" đã được lưu vào danh sách Hay quên.`,
                                  placement: "topRight",
                                  duration: 2
                                });
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border flex items-center gap-1.5 transition-all ${
                              studyCardsList[currentCardIdx].isDifficult === true
                                ? "bg-rose-500 text-white border-none shadow-sm shadow-rose-500/20"
                                : "bg-slate-50 dark:bg-slate-900 text-slate-500 border-gray-200 dark:border-slate-800 hover:bg-rose-50 hover:text-rose-500"
                            }`}
                          >
                            <FireOutlined className="text-xs" />
                            <span>Hard (Khó)</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>

              {/* Control buttons below */}
              <div className="space-y-4 flex flex-col items-center">
                <Button
                  type="primary"
                  onClick={(e) => {
                    e.stopPropagation(); // Ngăn click lan ra ngoài
                    if (currentCardIdx < (studyCardsList.length || 1) - 1) {
                      setCurrentCardIdx((prev: number) => prev + 1);
                      setIsCardFlipped(false);
                    } else {
                      setStudyMode("selection");
                      notification.success({
                        message: "Study Session Completed!",
                        description: "Well done! You've reviewed all cards scheduled in this notebook.",
                        placement: "topRight"
                      });
                    }
                  }}
                  className="bg-[#0056b3] hover:bg-blue-700 border-none rounded-xl font-bold h-10 px-8 text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>Next Card</span>
                  <ArrowRightOutlined />
                </Button>

                <div className="flex gap-4 items-center text-slate-400 text-xs">
                  <button onClick={(e) => { e.stopPropagation(); setStudyMode("selection"); }} className="hover:text-slate-700 transition-colors flex items-center gap-1.5 font-bold">
                    <CloseOutlined /> End Session
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Chọn Ngày để học Flashcards */}
      <Modal
        open={studyFilterModalOpen === "date"}
        onCancel={() => setStudyFilterModalOpen(null)}
        footer={null}
        destroyOnClose
        centered
        width={400}
        title={<span className="text-sm font-black text-slate-800 dark:text-white tracking-tight uppercase">📅 Chọn Ngày Học</span>}
        styles={{
          body: {
            padding: "20px 16px 16px 16px",
          }
        }}
        className="premium-vocab-modal select-none"
      >
        <div className="space-y-6">
          <p className="text-slate-400 text-xs font-semibold">
            Vui lòng chọn một ngày học từ danh sách sổ tay của bạn để ôn tập.
          </p>
          <Select
            placeholder="Chọn ngày học"
            className="w-full text-xs font-bold"
            size="large"
            value={selectedStudyDate}
            onChange={(val) => setSelectedStudyDate(val)}
          >
            {uniqueDatesList.map((dateStr) => (
              <Select.Option key={dateStr} value={dateStr}>
                {getFriendlyDateLabel(dateStr)} ({vocabsData?.data?.filter((v: any) => {
                  const d = new Date(v.createdAt);
                  const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  return dStr === dateStr;
                }).length || 0} từ)
              </Select.Option>
            ))}
          </Select>
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 dark:border-slate-800">
            <Button onClick={() => setStudyFilterModalOpen(null)} className="rounded-xl font-bold text-xs h-9">
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={handleConfirmDateStudy}
              className="bg-[#0056b3] hover:bg-blue-700 border-none rounded-xl font-bold text-xs h-9 px-6"
            >
              Học ngay
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Chọn Chủ Đề để học Flashcards */}
      <Modal
        open={studyFilterModalOpen === "topic"}
        onCancel={() => setStudyFilterModalOpen(null)}
        footer={null}
        destroyOnClose
        centered
        width={400}
        title={<span className="text-sm font-black text-slate-800 dark:text-white tracking-tight uppercase">🏷️ Chọn Chủ Đề</span>}
        styles={{
          body: {
            padding: "20px 16px 16px 16px",
          }
        }}
        className="premium-vocab-modal select-none"
      >
        <div className="space-y-6">
          <p className="text-slate-400 text-xs font-semibold">
            Chọn chủ đề (tag) chứa từ vựng mà bạn muốn tập trung ôn tập hôm nay.
          </p>
          <Select
            placeholder="Chọn tag chủ đề"
            className="w-full text-xs font-bold"
            size="large"
            value={selectedStudyTopic}
            onChange={(val) => setSelectedStudyTopic(val)}
          >
            {uniqueTagsList.map((tag) => (
              <Select.Option key={tag} value={tag}>
                #{tag} ({vocabsData?.data?.filter((v: any) => v.tags && v.tags.includes(tag)).length || 0} từ)
              </Select.Option>
            ))}
          </Select>
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 dark:border-slate-800">
            <Button onClick={() => setStudyFilterModalOpen(null)} className="rounded-xl font-bold text-xs h-9">
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={handleConfirmTopicStudy}
              className="bg-[#0056b3] hover:bg-blue-700 border-none rounded-xl font-bold text-xs h-9 px-6"
            >
              Học ngay
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Chọn Mức Độ để học Flashcards */}
      <Modal
        open={studyFilterModalOpen === "level"}
        onCancel={() => setStudyFilterModalOpen(null)}
        footer={null}
        destroyOnClose
        centered
        width={400}
        title={<span className="text-sm font-black text-slate-800 dark:text-white tracking-tight uppercase">📊 Chọn Mức Độ</span>}
        styles={{
          body: {
            padding: "20px 16px 16px 16px",
          }
        }}
        className="premium-vocab-modal select-none"
      >
        <div className="space-y-6">
          <p className="text-slate-400 text-xs font-semibold">
            Lựa chọn trình độ (CEFR Level) phù hợp với năng lực bạn muốn ôn luyện.
          </p>
          <Select
            placeholder="Chọn mức độ"
            className="w-full text-xs font-bold"
            size="large"
            value={selectedStudyLevel}
            onChange={(val) => setSelectedStudyLevel(val)}
          >
            {uniqueLevelsList.map((level) => (
              <Select.Option key={level} value={level}>
                Trình độ {level} ({vocabsData?.data?.filter((v: any) => v.level && v.level.toUpperCase() === level).length || 0} từ)
              </Select.Option>
            ))}
          </Select>
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 dark:border-slate-800">
            <Button onClick={() => setStudyFilterModalOpen(null)} className="rounded-xl font-bold text-xs h-9">
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={handleConfirmLevelStudy}
              className="bg-[#0056b3] hover:bg-blue-700 border-none rounded-xl font-bold text-xs h-9 px-6"
            >
              Học ngay
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
