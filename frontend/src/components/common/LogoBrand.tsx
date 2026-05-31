import React from "react";

interface LogoBrandProps {
  size?: "sm" | "md" | "lg" | "xl";
  align?: "left" | "center";
  showSubText?: boolean;
  subTextContent?: string;
}

export const LogoBrand: React.FC<LogoBrandProps> = ({ 
  size = "md", 
  align = "center",
  showSubText = true,
  subTextContent = "AI VOCABULARY NOTEBOOK"
}) => {
  // Map size classes
  const sizeMap = {
    sm: {
      text: "text-sm",
      subText: "text-[7px] tracking-[0.18em] mt-0.5",
      starSize: "w-2.5 h-2.5",
      starOffsetRight: "right-[-3px]",
      starOffsetTop: "top-[-3px]",
    },
    md: {
      text: "text-xl",
      subText: "text-[8px] tracking-[0.22em] mt-1.5",
      starSize: "w-3 h-3",
      starOffsetRight: "right-[-4px]",
      starOffsetTop: "top-[-4px]",
    },
    lg: {
      text: "text-2xl",
      subText: "text-[9px] tracking-[0.2em] mt-1.5",
      starSize: "w-3.5 h-3.5",
      starOffsetRight: "right-[-5px]",
      starOffsetTop: "top-[-5px]",
    },
    xl: {
      text: "text-3xl",
      subText: "text-[10px] tracking-[0.25em] mt-2",
      starSize: "w-4 h-4",
      starOffsetRight: "right-[-6px]",
      starOffsetTop: "top-[-6px]",
    }
  };

  const current = sizeMap[size];

  return (
    <div className={`flex flex-col ${align === "center" ? "items-center text-center" : "items-start text-left"} leading-none`}>
      <div className="relative flex items-center select-none">
        
        {/* Vocab */}
        <span className={`${current.text} font-black text-[#004cbe] dark:text-[#3b82f6] tracking-tight relative transition-colors duration-300`}>
          Vocab
          
          {/* Sparkle star sitting right above the transition between Vocab and Memo */}
          <span className={`absolute ${current.starOffsetRight} ${current.starOffsetTop} text-[#0082df] dark:text-[#38bdf8] animate-pulse`}>
            <svg className={`${current.starSize} fill-current drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]`} viewBox="0 0 24 24">
              <path d="M12 2c0 5.523 4.477 10 10 10-5.523 0-10 4.477-10 10 0-5.523-4.477-10-10-10 5.523 0 10-4.477 10-10z" />
            </svg>
          </span>
        </span>

        {/* Memo */}
        <span className={`${current.text} font-black text-[#0c75c9] dark:text-[#00a2ff] tracking-tight transition-colors duration-300 ml-0.5`}>
          Memo
        </span>
      </div>
      
      {showSubText && (
        <span className={`${current.subText} font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500`}>
          {subTextContent}
        </span>
      )}
    </div>
  );
};

export default LogoBrand;
