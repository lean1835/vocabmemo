import React, { useMemo, useState } from "react";
import { Dropdown, Spin, Drawer } from "antd";
import type { MenuProps } from "antd";
import {
  BookOutlined,
  InboxOutlined,
  DashboardOutlined,
  HistoryOutlined,
  CompassOutlined,
  FireOutlined,
  MenuOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useGetMeQuery } from "../../auth/services/authApi";
import { useGetVocabsQuery } from "../services/vocabApi";
import { LogoBrand } from "../../../components/common/LogoBrand";

interface DashboardLayoutProps {
  currentTab: "notebook" | "flashcards" | "difficult" | "dashboard" | "archive";
  children: React.ReactNode;
  streakCountOverride?: number;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ currentTab, children, streakCountOverride }) => {
  const navigate = useNavigate();

  // API calls
  const token = localStorage.getItem("token");
  const { data: meData } = useGetMeQuery(undefined, { skip: !token });
  const username = meData?.data?.username || "Học viên";
  const userInitials = username.slice(0, 2).toUpperCase();

  const { data: vocabsData } = useGetVocabsQuery({
    page: 1,
    limit: 100
  });

  const setCurrentTab = (tab: "notebook" | "flashcards" | "difficult" | "dashboard" | "archive") => {
    navigate(`/${tab}`);
  };

  // Tính toán chuỗi học tập (Streak) từ dữ liệu User ở DB
  const rawStreakCount = meData?.data?.streakCount || 0;
  const streakCount = streakCountOverride !== undefined && streakCountOverride > 0 ? streakCountOverride : rawStreakCount;

  const isStreakActive = useMemo(() => {
    if (streakCountOverride !== undefined && streakCountOverride > 0) return true;
    if (!meData?.data?.lastActiveDate) return false;
    // Lấy ngày hôm nay ở múi giờ Việt Nam (UTC+7)
    const tzDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const todayStr = tzDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
    return meData.data.lastActiveDate === todayStr;
  }, [meData, streakCountOverride]);

  // Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
    window.location.reload();
  };

  // Menu Avatar
  const userMenuItems: MenuProps["items"] = [
    {
      key: "username",
      label: <span className="font-bold text-blue-600">{username}</span>,
      disabled: true,
    },
    { type: "divider" },
    {
      key: "logout",
      label: "Đăng xuất",
      onClick: handleLogout,
      danger: true,
    },
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-white text-slate-900 dark:bg-black dark:text-slate-100 font-sans overflow-hidden">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden w-full h-16 bg-white dark:bg-[#151515] border-b border-gray-100 dark:border-slate-900 px-6 flex items-center justify-between shrink-0 z-50 absolute top-0 left-0 right-0">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-900 border-none bg-transparent outline-none cursor-pointer flex items-center justify-center"
        >
          <MenuOutlined className="text-lg" />
        </button>
        <div onClick={() => navigate("/")} className="cursor-pointer">
          <LogoBrand size="sm" align="center" subTextContent="AI NOTEBOOK" />
        </div>
        {/* Streak Badge - mobile top right */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-sm select-none border transition-all ${
          isStreakActive
            ? "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800/80"
            : "bg-slate-50 dark:bg-slate-950/40 border-gray-200/60 dark:border-slate-900/60"
        }`}>
          <svg
            className={`w-3.5 h-3.5 transition-colors ${
              isStreakActive ? "text-[#ff9500] dark:text-[#ffb300]" : "text-slate-300 dark:text-slate-700"
            }`}
            viewBox="0 0 24 24"
            fill={isStreakActive ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
          <span className={`text-[10px] font-black tracking-tight leading-none transition-colors ${
            isStreakActive ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"
          }`}>
            {streakCount} day
          </span>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        styles={{ body: { padding: 0 } }}
        className="dark:bg-[#151515]"
      >
        <div className="h-full bg-white dark:bg-[#151515] p-6 flex flex-col justify-between">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <LogoBrand size="md" align="left" subTextContent="AI NOTEBOOK" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-all cursor-pointer outline-none bg-transparent"
              >
                ✕
              </button>
            </div>
            <nav className="space-y-1" onClick={() => setMobileMenuOpen(false)}>
              <button
                onClick={() => setCurrentTab("notebook")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border-none outline-none ${
                  currentTab === "notebook"
                    ? "bg-[#0056b3] text-white shadow-sm"
                    : "text-slate-600 dark:text-gray-400 hover:bg-[#e2e8f0] dark:hover:bg-slate-800/40"
                }`}
              >
                <BookOutlined className={`text-sm ${currentTab === "notebook" ? "text-white" : "text-slate-400"}`} />
                <span>Notebook</span>
              </button>

              <button
                onClick={() => setCurrentTab("flashcards")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border-none outline-none ${
                  currentTab === "flashcards"
                    ? "bg-[#0056b3] text-white shadow-sm"
                    : "text-slate-600 dark:text-gray-400 hover:bg-[#e2e8f0] dark:hover:bg-slate-800/40"
                }`}
              >
                <InboxOutlined className={`text-sm ${currentTab === "flashcards" ? "text-white" : "text-slate-400"}`} />
                <span>Flashcards</span>
              </button>

              <button
                onClick={() => setCurrentTab("difficult")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border-none outline-none ${
                  currentTab === "difficult"
                    ? "bg-[#0056b3] text-white shadow-sm"
                    : "text-slate-600 dark:text-gray-400 hover:bg-[#e2e8f0] dark:hover:bg-slate-800/40"
                }`}
              >
                <FireOutlined className={`text-sm ${currentTab === "difficult" ? "text-white" : "text-slate-400"}`} />
                <span>Difficult Words</span>
              </button>

              <button
                onClick={() => setCurrentTab("dashboard")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border-none outline-none ${
                  currentTab === "dashboard"
                    ? "bg-[#0056b3] text-white shadow-sm"
                    : "text-slate-600 dark:text-gray-400 hover:bg-[#e2e8f0] dark:hover:bg-slate-800/40"
                }`}
              >
                <DashboardOutlined className={`text-sm ${currentTab === "dashboard" ? "text-white" : "text-slate-400"}`} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setCurrentTab("archive")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border-none outline-none ${
                  currentTab === "archive"
                    ? "bg-[#0056b3] text-white shadow-sm"
                    : "text-slate-600 dark:text-gray-400 hover:bg-[#e2e8f0] dark:hover:bg-slate-800/40"
                }`}
              >
                <HistoryOutlined className={`text-sm ${currentTab === "archive" ? "text-white" : "text-slate-400"}`} />
                <span>Archive</span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0056b3] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {userInitials}
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black text-slate-800 dark:text-white mb-0 leading-tight truncate max-w-[120px]">{username}</p>
                <span className="text-[9px] font-bold text-slate-400">Settings</span>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="text-[10px] font-bold text-red-500 hover:text-red-600 bg-transparent border-none outline-none cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </Drawer>

      {/* LEFT SIDEBAR PANEL (Desktop only) */}
      <aside className="hidden md:flex w-[260px] bg-white dark:bg-[#151515] border-r border-gray-100 dark:border-slate-900 p-6 flex-col justify-between shrink-0 h-full">
        <div className="space-y-8">
          
          {/* Logo Full brand VocabMemo */}
          <div
            onClick={() => navigate("/")}
            className="px-1 select-none font-sans flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <LogoBrand size="md" align="left" subTextContent="AI NOTEBOOK" />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setCurrentTab("notebook")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border-none outline-none ${
                currentTab === "notebook"
                  ? "bg-[#0056b3] text-white shadow-sm"
                  : "text-slate-600 dark:text-gray-400 hover:bg-[#e2e8f0] dark:hover:bg-slate-800/40"
              }`}
            >
              <BookOutlined className={`text-sm ${currentTab === "notebook" ? "text-white" : "text-slate-400"}`} />
              <span>Notebook</span>
            </button>

            <button
              onClick={() => setCurrentTab("flashcards")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border-none outline-none ${
                currentTab === "flashcards"
                  ? "bg-[#0056b3] text-white shadow-sm"
                  : "text-slate-600 dark:text-gray-400 hover:bg-[#e2e8f0] dark:hover:bg-slate-800/40"
              }`}
            >
              <InboxOutlined className={`text-sm ${currentTab === "flashcards" ? "text-white" : "text-slate-400"}`} />
              <span>Flashcards</span>
            </button>

            <button
              onClick={() => setCurrentTab("difficult")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border-none outline-none ${
                currentTab === "difficult"
                  ? "bg-[#0056b3] text-white shadow-sm"
                  : "text-slate-600 dark:text-gray-400 hover:bg-[#e2e8f0] dark:hover:bg-slate-800/40"
              }`}
            >
              <FireOutlined className={`text-sm ${currentTab === "difficult" ? "text-white" : "text-slate-400"}`} />
              <span>Difficult Words</span>
            </button>

            <button
              onClick={() => setCurrentTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border-none outline-none ${
                currentTab === "dashboard"
                  ? "bg-[#0056b3] text-white shadow-sm"
                  : "text-slate-600 dark:text-gray-400 hover:bg-[#e2e8f0] dark:hover:bg-slate-800/40"
              }`}
            >
              <DashboardOutlined className={`text-sm ${currentTab === "dashboard" ? "text-white" : "text-slate-400"}`} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentTab("archive")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border-none outline-none ${
                currentTab === "archive"
                  ? "bg-[#0056b3] text-white shadow-sm"
                  : "text-slate-600 dark:text-gray-400 hover:bg-[#e2e8f0] dark:hover:bg-slate-800/40"
              }`}
            >
              <HistoryOutlined className={`text-sm ${currentTab === "archive" ? "text-white" : "text-slate-400"}`} />
              <span>Archive</span>
            </button>
          </nav>
        </div>

        {/* User Account bottom widget */}
        <div className="pt-4 border-t border-gray-100 dark:border-slate-900 flex items-center justify-between">
          <Dropdown menu={{ items: userMenuItems }} placement="topRight" arrow>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-[#0056b3] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {userInitials}
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black text-slate-800 dark:text-white mb-0 leading-tight group-hover:text-blue-600 truncate max-w-[120px]">{username}</p>
                <span className="text-[9px] font-bold text-slate-400">Settings</span>
              </div>
            </div>
          </Dropdown>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-black relative pt-16 md:pt-0">
        
        {/* Streak Badge Floating in Top Right Corner (Desktop only) */}
        <div className={`hidden md:flex absolute top-6 right-8 items-center gap-2 px-3 py-1.5 rounded-full shadow-sm z-40 select-none border transition-all ${
          isStreakActive
            ? "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800/80"
            : "bg-slate-50 dark:bg-slate-950/40 border-gray-200/60 dark:border-slate-900/60"
        }`}>
          <svg
            className={`w-3.5 h-3.5 transition-colors ${
              isStreakActive ? "text-[#ff9500] dark:text-[#ffb300]" : "text-slate-300 dark:text-slate-700"
            }`}
            viewBox="0 0 24 24"
            fill={isStreakActive ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
          <span className={`text-[10px] font-black tracking-tight leading-none transition-colors ${
            isStreakActive ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"
          }`}>
            {streakCount} Day Streak
          </span>
        </div>

        {/* WORKSPACE VIEW CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
          {children}
        </div>
      </div>
    </div>
  );
};
