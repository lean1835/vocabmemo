import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Col, Row } from "antd";
import {
  ArrowRightOutlined,
  PlayCircleOutlined,
  CompassOutlined,
  CopyOutlined,
  LineChartOutlined,
  TranslationOutlined,
  SoundOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import { LogoBrand } from "../../../components/common/LogoBrand";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // React State Machine for landing page workflow animation
  const [demoStep, setDemoStep] = useState<"typing" | "analyzing" | "completed">("typing");
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    let timer: any;
    const word = "ephemeral";

    if (demoStep === "typing") {
      let index = 0;
      setTypedText("");
      const interval = setInterval(() => {
        if (index < word.length) {
          setTypedText(prev => prev + word.charAt(index));
          index++;
        } else {
          clearInterval(interval);
          timer = setTimeout(() => {
            setDemoStep("analyzing");
          }, 1200);
        }
      }, 150);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    } else if (demoStep === "analyzing") {
      timer = setTimeout(() => {
        setDemoStep("completed");
      }, 2200);
      return () => clearTimeout(timer);
    } else if (demoStep === "completed") {
      timer = setTimeout(() => {
        setDemoStep("typing");
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [demoStep]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      
      {/* NAVBAR */}
      <nav className="max-w-6xl mx-auto w-full px-6 py-4 flex items-center justify-between border-b border-gray-100 shrink-0">
        <div className="select-none font-sans flex items-center gap-2.5">
          <img src="/logomini.png" alt="VocabMemo Icon" className="w-8 h-8 object-contain shrink-0" />
          <LogoBrand size="sm" align="left" subTextContent="AI NOTEBOOK" />
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</a>
          <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="px-6 pt-16 pb-20 flex flex-col items-center text-center max-w-4xl mx-auto w-full">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-tight max-w-3xl">
          Quick Notes<br />Powered by AI
        </h1>
        
        <p className="text-base md:text-lg text-slate-500 max-w-2xl mb-10 leading-relaxed font-medium">
          Master vocabulary naturally. VocabMemo acts as your quiet, sophisticated mentor, curating personalized flashcards and deep linguistic insights to accelerate your fluency.
        </p>

        <div className="flex gap-4 justify-center flex-wrap mb-16">
          <Button
            type="primary"
            onClick={() => navigate(token ? "/dashboard" : "/login")}
            className="bg-[#0056b3] hover:bg-blue-700 border-none rounded-xl font-bold h-12 px-8 text-sm shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
          >
            <span>{token ? "Go to my notebook" : "Get Started for Free"}</span>
            <ArrowRightOutlined />
          </Button>
        </div>

        {/* Center Tablet/Showcase Frame with interactive CSS & React workflow demonstration */}
        <div className="w-full max-w-3xl bg-slate-50 dark:bg-slate-950/40 rounded-[2.5rem] p-8 border border-gray-100 dark:border-slate-900 shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[380px] mb-12 select-none">
          
          {/* Faded/Decorative notebook papers in backdrop */}
          <div className="absolute right-[-40px] top-12 w-[180px] h-[220px] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 rotate-12 opacity-30 hidden md:block pointer-events-none" />
          <div className="absolute left-[-50px] bottom-6 w-[200px] h-[200px] bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 -rotate-12 opacity-20 hidden md:block pointer-events-none" />

          {/* Workflow Step Indicators */}
          <div className="flex items-center gap-4 mb-6 z-10 text-[9px] font-black uppercase tracking-widest text-slate-400">
            <span className={`transition-colors duration-300 ${demoStep === "typing" ? "text-blue-600" : ""}`}>1. Input Word</span>
            <span className="w-4 h-[1px] bg-slate-300" />
            <span className={`transition-colors duration-300 ${demoStep === "analyzing" ? "text-blue-600" : ""}`}>2. AI Analysis</span>
            <span className="w-4 h-[1px] bg-slate-300" />
            <span className={`transition-colors duration-300 ${demoStep === "completed" ? "text-emerald-600" : ""}`}>3. Notebook Card</span>
          </div>

          <div className="w-full max-w-md min-h-[240px] flex items-center justify-center relative z-10">
            
            {/* STEP 1: Typing simulated input */}
            {demoStep === "typing" && (
              <div className="w-full bg-white dark:bg-[#1c1c1e] rounded-3xl border border-gray-200/60 dark:border-slate-800/80 p-6 shadow-xl shadow-slate-200/20 dark:shadow-none flex flex-col space-y-4 animate-streak-pop">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Notebook Quick Add</span>
                <div className="relative w-full">
                  <div className="w-full pl-5 pr-14 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white flex items-center text-left">
                    {typedText}
                    <span className="w-1.5 h-4 bg-blue-600 ml-0.5 animate-pulse shrink-0" />
                  </div>
                  <Button
                    type="primary"
                    disabled
                    icon={<ArrowRightOutlined />}
                    className="absolute right-2 top-2 h-8 w-8 rounded-xl bg-[#0056b3] border-none flex items-center justify-center"
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 text-center">Type any word, idiom, or sentence in any language...</p>
              </div>
            )}

            {/* STEP 2: AI Translating & Structuring */}
            {demoStep === "analyzing" && (
              <div className="w-full bg-white dark:bg-[#1c1c1e] rounded-3xl border border-gray-200/60 dark:border-slate-800/80 p-8 shadow-xl shadow-slate-200/20 dark:shadow-none flex flex-col items-center justify-center space-y-4 animate-streak-pop">
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-blue-100 border-t-blue-600 animate-spin" />
                  <CompassOutlined className="absolute text-blue-600 text-lg animate-pulse" />
                </div>
                <div className="space-y-1 text-center">
                  <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block">AI is Translating & Structuring</span>
                  <p className="text-[10px] font-bold text-slate-400 max-w-xs leading-relaxed mx-auto">Generating pronunciations, parts of speech, translations, definitions, registers, and contextual examples...</p>
                </div>
              </div>
            )}

            {/* STEP 3: Complete Archive-style Card layout */}
            {demoStep === "completed" && (
              <div className="w-full bg-white dark:bg-[#1c1c1e] rounded-3xl border border-gray-200/60 dark:border-slate-800/80 p-6 shadow-xl shadow-slate-200/30 dark:shadow-none flex flex-col space-y-4 text-left animate-streak-pop">
                
                {/* Top Row: Word, speaker, ipa, level, category, meatball */}
                <div className="flex items-center flex-wrap gap-2 w-full">
                  <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">ephemeral</span>
                  <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] cursor-pointer hover:text-blue-600 transition-colors">
                    <SoundOutlined />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">/ɪˈfem(ə)rəl/</span>
                  
                  {/* Topic Hashtags badges */}
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-slate-900 border border-indigo-100/40 dark:border-indigo-800/40 px-2 py-0.5 rounded-full uppercase">
                      #vocabulary
                    </span>
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-slate-900 border border-indigo-100/40 dark:border-indigo-800/40 px-2 py-0.5 rounded-full uppercase">
                      #poetic
                    </span>
                  </div>
                </div>

                {/* Part of Speech & Level Ribbons Row */}
                <div className="flex items-center gap-2">
                  <div className="w-fit bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase">
                    ADJECTIVE
                  </div>
                  <div className="w-fit px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/40">
                    C1
                  </div>
                </div>

                {/* Translations */}
                <div className="space-y-1">
                  <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold leading-relaxed mb-0">
                    Phù du, chóng tàn, ngắn ngủi
                  </p>
                  <p className="text-slate-400 text-xs italic font-medium mb-0">
                    Lasting for a very short time; transient.
                  </p>
                </div>

                {/* Examples section with vertical blue border on left */}
                <div className="border-l-2 border-blue-500 pl-4 py-1.5 space-y-1 bg-slate-50/20 dark:bg-slate-900/10 rounded-r-xl">
                  <p className="text-slate-700 dark:text-slate-300 font-semibold mb-0 text-xs">
                    Fame is <span className="font-black text-slate-800 dark:text-white">ephemeral</span>, but character endures.
                  </p>
                  <p className="text-slate-400 text-[10px] font-bold mb-0">
                    Danh tiếng thì phù du, nhưng nhân cách thì trường tồn.
                  </p>
                </div>

                {/* Success Streak Pop-up Celebratory Notification embedded at bottom */}
                <div className="pt-2.5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-black">
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircleOutlined /> Saved to Notebook!
                  </span>
                  <span className="text-[#ff9500] flex items-center gap-1 animate-pulse">
                    🔥 Streak +1 Day!
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* INTELLIGENCE SECTION */}
      <section id="features" className="py-20 bg-slate-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 w-full">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Intelligence in Every Interaction</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              A suite of tools designed to fade into the background, leaving only your linguistic progress in focus.
            </p>
          </div>

          <Row gutter={[24, 24]}>
            {/* Contextual Generation */}
            <Col xs={24} md={12}>
              <Card className="h-full border-none shadow-sm rounded-3xl bg-white p-6 flex flex-col justify-between overflow-hidden">
                <div className="space-y-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <CopyOutlined className="text-lg" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Contextual Generation</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-medium">
                    Don't just learn words in a vacuum. Our AI reads your inputs and suggests vocabulary relevant to your actual interests and current skill level, creating a living dictionary.
                  </p>
                </div>
                {/* Visual Block Mockup */}
                <div className="bg-slate-50 rounded-2xl border border-gray-100 p-4 font-mono text-[10px] text-slate-400 space-y-2 mt-auto">
                  <div className="flex gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-100 rounded-full shrink-0" />
                    <span className="w-2.5 h-2.5 bg-emerald-100 rounded-full shrink-0" />
                  </div>
                  <div className="bg-white px-3 py-2 rounded-lg border border-gray-200/50 italic">
                    "Generating context sentences..."
                  </div>
                </div>
              </Card>
            </Col>

            {/* Smart Flashcards */}
            <Col xs={24} md={12}>
              <Card className="h-full border-none shadow-sm rounded-3xl bg-white p-6 flex flex-col justify-between overflow-hidden">
                <div className="space-y-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <CompassOutlined className="text-lg" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Smart Flashcards</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-medium">
                    Spaced repetition algorithms tuned perfectly to your unique forgetting curve, ensuring long-term retention without cognitive overload.
                  </p>
                </div>
                {/* Overlapping Cards Stack Mockup */}
                <div className="relative h-[80px] w-full flex justify-center mt-auto">
                  <div className="absolute bottom-0 w-[140px] h-[55px] bg-slate-50 rounded-xl border border-gray-200/60 shadow-sm flex items-center justify-center font-bold text-xs text-slate-300 scale-90 translate-y-2 -rotate-3" />
                  <div className="absolute bottom-1 w-[140px] h-[55px] bg-slate-50 rounded-xl border border-gray-200/60 shadow-sm flex items-center justify-center font-bold text-xs text-slate-400 scale-95 -translate-y-1 rotate-3" />
                  <div className="absolute bottom-2 w-[140px] h-[55px] bg-white rounded-xl border border-gray-200 shadow-md flex items-center justify-center font-black text-xs text-slate-800">
                    L'avenir
                  </div>
                </div>
              </Card>
            </Col>

            {/* Deep Insights */}
            <Col xs={24} md={12}>
              <Card className="h-full border-none shadow-sm rounded-3xl bg-white p-6 flex flex-col justify-between overflow-hidden">
                <div className="space-y-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <LineChartOutlined className="text-lg" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Deep Insights</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-medium">
                    Track your fluency trajectory with clean, unobtrusive metrics that motivate rather than distract.
                  </p>
                </div>
                {/* Small Sparkline Grid Mockup */}
                <div className="bg-slate-50 rounded-2xl border border-gray-100 p-4 flex justify-between items-end h-[80px] w-full mt-auto">
                  <span className="w-4 bg-emerald-100 h-[20%] rounded-sm" />
                  <span className="w-4 bg-emerald-100 h-[35%] rounded-sm" />
                  <span className="w-4 bg-emerald-200 h-[45%] rounded-sm" />
                  <span className="w-4 bg-emerald-200 h-[30%] rounded-sm" />
                  <span className="w-4 bg-emerald-300 h-[65%] rounded-sm" />
                  <span className="w-4 bg-emerald-300 h-[50%] rounded-sm" />
                  <span className="w-4 bg-[#0056b3] h-[90%] rounded-sm" />
                </div>
              </Card>
            </Col>

            {/* Nuance Detection */}
            <Col xs={24} md={12}>
              <Card className="h-full border-none shadow-sm rounded-3xl bg-white p-6 flex flex-col justify-between overflow-hidden">
                <div className="space-y-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <TranslationOutlined className="text-lg" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Nuance Detection</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-medium">
                    Understand the subtle differences between synonyms. The AI breaks down register, tone, and common collocations for every entry.
                  </p>
                </div>
                {/* Dictionary nuance list table */}
                <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100 text-[10px] font-bold text-slate-700 mt-auto">
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-800">Look</span>
                    <span className="text-slate-400 font-semibold">Neutral</span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-800">Gaze</span>
                    <span className="text-blue-500">Intentional</span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-800">Glare</span>
                    <span className="text-red-500">Hostile</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 py-8 px-6 text-center text-xs text-slate-400 font-medium shrink-0">
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-4">
          <span>© 2026 VocabMemo. Designed for focus.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Help Center</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
      
    </div>
  );
};

export default LandingPage;
