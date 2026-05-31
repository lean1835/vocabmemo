import React, { useMemo } from "react";
import { Button } from "antd";
import {
  BookOutlined,
  RadarChartOutlined,
  FireOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  BarChartOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useGetVocabsQuery, useGetVocabMetadataQuery } from "../services/vocabApi";

export const OverviewTab: React.FC = () => {
  const navigate = useNavigate();

  // API calls
  const { data: vocabsData } = useGetVocabsQuery({
    page: 1,
    limit: 100
  });

  const { data: metadataData } = useGetVocabMetadataQuery();
  const categoriesList = metadataData?.data?.categories || [];

  // Tính toán 100% dữ liệu thật
  const stats = useMemo(() => {
    const list = vocabsData?.data || [];
    const total = list.length;
    const difficult = list.filter((v: any) => v.isDifficult).length;
    const easy = total - difficult;
    const masteryRate = total > 0 ? Math.round((easy / total) * 100) : 100;

    // 1. Phân bổ cấp độ CEFR (Real Data)
    const levelsMap: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    list.forEach((v: any) => {
      const lvl = v.level?.toUpperCase().trim();
      if (levelsMap[lvl] !== undefined) {
        levelsMap[lvl]++;
      }
    });

    // 2. Phân loại từ loại (Real Data)
    const posMap: Record<string, number> = { Nouns: 0, Verbs: 0, Adjectives: 0, Adverbs: 0, Others: 0 };
    list.forEach((v: any) => {
      const pos = v.partOfSpeech?.toLowerCase().trim() || "";
      if (pos.includes("noun") || pos.includes("danh")) posMap.Nouns++;
      else if (pos.includes("verb") || pos.includes("động") || pos.includes("dong")) posMap.Verbs++;
      else if (pos.includes("adj") || pos.includes("tính") || pos.includes("tinh")) posMap.Adjectives++;
      else if (pos.includes("adv") || pos.includes("trạng") || pos.includes("trang")) posMap.Adverbs++;
      else posMap.Others++;
    });

    // 3. Lịch sử tăng trưởng từ vựng trong 7 ngày gần nhất (Real Data)
    const dailyGrowth = Array(7).fill(0);
    const dayLabels = Array(7).fill("");
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      
      // Label e.g. "30/05"
      dayLabels[6 - i] = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      
      // Đếm tổng số từ được tạo từ mốc dStr trở về trước
      const count = list.filter((v: any) => {
        const vDate = new Date(v.createdAt);
        const vDateStr = `${vDate.getFullYear()}-${String(vDate.getMonth() + 1).padStart(2, "0")}-${String(vDate.getDate()).padStart(2, "0")}`;
        return vDateStr <= dStr;
      }).length;
      
      dailyGrowth[6 - i] = count;
    }

    // 4. Danh sách các từ đang bị đánh dấu là khó học (Real Data)
    const weakPoints = list
      .filter((v: any) => v.isDifficult)
      .slice(0, 6)
      .map((v: any) => v.correctedWord);

    return {
      total,
      difficult,
      easy,
      masteryRate,
      levelsMap,
      posMap,
      dailyGrowth,
      dayLabels,
      weakPoints
    };
  }, [vocabsData]);

  // Vẽ biểu đồ SVG Đường Tăng trưởng tự động theo dữ liệu 7 ngày thật
  const growthChartData = useMemo(() => {
    const maxVal = Math.max(...stats.dailyGrowth, 5);
    const points = stats.dailyGrowth.map((count, index) => {
      const x = (index / 6) * 100;
      // Dịch chuyển y từ mốc 5 (đỉnh) tới 28 (đáy) của SVG viewBox="0 0 100 30"
      const y = 28 - (count / maxVal) * 20;
      return { x, y, count };
    });

    const dPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
    const areaPath = `${dPath} L 100,30 L 0,30 Z`;

    return { points, dPath, areaPath, maxVal };
  }, [stats]);

  // Lấy giá trị lớn nhất của cột cấp độ để scale biểu đồ cột
  const maxLevelCount = useMemo(() => {
    return Math.max(...Object.values(stats.levelsMap), 1);
  }, [stats]);

  return (
    <div className="space-y-6 pt-4 max-w-5xl mx-auto w-full">
      
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Overview</h2>
        <p className="text-slate-400 text-xs font-semibold">Báo cáo phân tích và thống kê 100% dữ liệu thực tế từ sổ tay của bạn.</p>
      </div>

      {/* Grid 1st Row: Mastered Widget + Growth line chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Words Mastered */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200/50 dark:border-slate-800/80 p-5 shadow-sm flex flex-col justify-between h-[180px]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Words Mastered</span>
            <span className="text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <TrophyOutlined />
              <span>{stats.masteryRate}% Mastered</span>
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-4xl font-black text-slate-800 dark:text-white leading-tight">
              {stats.total}
            </h3>
            <p className="text-[10px] font-semibold text-slate-400 mb-0">
              gồm {stats.difficult} từ hay quên • {categoriesList.length || 0} chủ đề
            </p>
          </div>
        </div>

        {/* Growth Trajectory - 100% Real SVG Line Chart */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200/50 dark:border-slate-800/80 p-5 shadow-sm h-[180px] md:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Growth Trajectory</span>
            <span className="text-[9px] font-bold text-[#0056b3] bg-blue-50 dark:bg-slate-900 border border-blue-100/50 px-2 py-0.5 rounded-full">Lịch sử 7 ngày</span>
          </div>
          
          <div className="w-full h-[85px] mt-2 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0056b3" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0056b3" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={growthChartData.areaPath} fill="url(#chartGradient)" />
              <path d={growthChartData.dPath} fill="none" stroke="#0056b3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              {growthChartData.points.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="1" fill="#0056b3" />
                  <circle cx={p.x} cy={p.y} r="2.5" fill="#0056b3" className="opacity-15" />
                </g>
              ))}
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between text-[8px] font-black text-slate-400 dark:text-slate-500 px-0.5">
            {stats.dayLabels.map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Grid 2nd Row: CEFR Level Breakdown + Part of Speech Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CEFR Level Bar Chart - 100% Real Data */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200/50 dark:border-slate-800/80 p-5 shadow-sm h-[220px] flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">CEFR Level Distribution</span>
            <span className="text-[9px] font-bold text-slate-400"><BarChartOutlined /> Phân bổ cấp độ</span>
          </div>
          <div className="flex items-end justify-between px-2 h-[120px] pt-4">
            {Object.entries(stats.levelsMap).map(([lvl, count]) => {
              // Chọn màu theo cấp độ (emerald cho A, blue cho B, amber cho C)
              let barColor = "bg-emerald-500";
              if (lvl.startsWith("B")) barColor = "bg-blue-600";
              if (lvl.startsWith("C")) barColor = "bg-amber-500";

              const pctHeight = (count / maxLevelCount) * 80 + 5; // Tối thiểu 5% để vẫn hiển thị vạch nhỏ

              return (
                <div key={lvl} className="flex flex-col items-center gap-1.5 w-8 group relative">
                  {/* Tooltip on hover */}
                  <span className="absolute -top-6 text-[9px] font-black bg-slate-800 dark:bg-slate-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-sm leading-none pointer-events-none">
                    {count} từ
                  </span>
                  <div className="w-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-sm h-[80px] flex items-end justify-center">
                    <div
                      className={`w-full rounded-sm transition-all duration-500 ${barColor}`}
                      style={{ height: `${pctHeight}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors">{lvl}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Part of Speech & Categories breakdown - 100% Real Progress segments */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200/50 dark:border-slate-800/80 p-6 shadow-sm h-[220px] md:col-span-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-4">Vocabulary Composition</span>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {Object.entries(stats.posMap).map(([pos, count]) => {
                const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                let colorClass = "bg-blue-600";
                if (pos === "Nouns") colorClass = "bg-indigo-500";
                if (pos === "Verbs") colorClass = "bg-emerald-500";
                if (pos === "Adjectives") colorClass = "bg-amber-500";
                if (pos === "Adverbs") colorClass = "bg-rose-500";

                return (
                  <div key={pos} className="space-y-1 text-left">
                    <div className="flex justify-between items-center text-[9px] font-black">
                      <span className="text-slate-500 dark:text-gray-400 uppercase tracking-wider">{pos}</span>
                      <span className="text-slate-800 dark:text-white">{count} từ ({percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 border border-gray-100 dark:border-slate-800/40 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Grid 3rd Row: Weak Points + AI Smart Insight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Real Weak Points (Difficult list) */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200/50 dark:border-slate-800/80 p-5 shadow-sm flex flex-col justify-between min-h-[200px]">
          <div className="space-y-2.5 text-left">
            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <FireOutlined className="text-red-500" />
              <span>Từ Hay Quên Cần Ôn Tập</span>
            </h4>
            <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
              Các từ vựng bạn vừa đánh dấu là Khó học. Hãy ôn tập ngay bằng Flashcards để sớm làm chủ chúng.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {stats.weakPoints.length > 0 ? (
                stats.weakPoints.map((word: string, idx: number) => (
                  <span
                    key={idx}
                    onClick={() => navigate("/difficult")}
                    className="bg-red-50 dark:bg-red-950/20 text-[9px] font-black text-red-600 dark:text-red-400 border border-red-100/30 px-2.5 py-1 rounded-xl cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    🔥 {word}
                  </span>
                ))
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold py-2 px-1">
                  <CheckCircleOutlined />
                  <span>Tuyệt vời! Bạn không có từ khó nào chưa thuộc.</span>
                </div>
              )}
            </div>
          </div>
          {stats.difficult > 0 && (
            <Button
              type="primary"
              onClick={() => navigate("/flashcards")}
              className="bg-[#0056b3] hover:bg-blue-700 border-none rounded-xl font-bold h-9 w-fit px-5 text-[10px] shadow-sm flex items-center gap-1.5 mt-4"
            >
              <span>Luyện tập ngay</span>
            </Button>
          )}
        </div>

        {/* Smart Suggestions AI insight block (100% Real context-aware suggestions) */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200/50 dark:border-slate-800/80 p-6 shadow-sm min-h-[200px] flex flex-col justify-between text-left">
          <div className="space-y-3">
            <span className="text-[9px] font-black uppercase text-blue-600 tracking-wider bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 px-2 py-0.5 rounded-full inline-block">✨ AI Insights</span>
            <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight">Gợi ý học tập hôm nay</h3>
            <p className="text-[11px] font-medium text-slate-500 dark:text-gray-400 leading-relaxed mb-0">
              {stats.total === 0 ? (
                "Chào mừng bạn đến với VocabMemo! Sổ tay của bạn hiện tại chưa có từ vựng nào. Hãy truy cập tab Notebook và nhập một vài từ mới để AI tự động phân tích định nghĩa chuẩn CEFR nhé."
              ) : stats.difficult > 0 ? (
                `Hiện tại bạn đang có ${stats.difficult} từ vựng hay quên (chiếm ${Math.round((stats.difficult / stats.total) * 100)}% tổng số từ). Lời khuyên: Hãy bắt đầu ngay 1 phiên Flashcard ôn tập bộ lọc "Difficult Words" để luyện trí nhớ và đánh dấu chúng thành Easy.`
              ) : stats.masteryRate === 100 ? (
                `Chúc mừng! Bạn đã làm chủ xuất sắc 100% tổng số ${stats.total} từ vựng trong sổ tay. Không có từ nào bị xếp vào loại khó học. Bạn có thể tiếp tục thêm từ mới để nâng cao vốn từ vựng của mình.`
              ) : (
                `Tỉ lệ làm chủ từ vựng của bạn đạt ${stats.masteryRate}%. Biểu đồ tăng trưởng cho thấy bạn đang tiến bộ rất đều đặn. Hãy duy trì thói quen học tập để hoàn thành mục tiêu ôn tập tuần này.`
              )}
            </p>
          </div>
          <Button
            type="primary"
            onClick={() => navigate(stats.total === 0 ? "/notebook" : "/flashcards")}
            className="bg-[#0056b3] hover:bg-blue-700 border-none rounded-xl font-bold h-9 w-fit px-5 text-[10px] shadow-sm flex items-center gap-1.5 mt-4"
          >
            <span>{stats.total === 0 ? "Bắt đầu học" : "Ôn tập Flashcards"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
