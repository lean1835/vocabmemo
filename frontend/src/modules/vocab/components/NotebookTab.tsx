import React, { useState, useEffect, useMemo } from "react";
import { Button, Spin, Empty, notification, Popconfirm, Modal, Pagination } from "antd";
import {
  CompassOutlined,
  ArrowUpOutlined,
  SettingOutlined,
  HistoryOutlined,
  SearchOutlined,
  SoundOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import { playVocabSpeech } from "../services/tts";
import {
  useGetVocabsQuery,
  useCreateVocabMutation,
  useDeleteVocabMutation
} from "../services/vocabApi";

interface NotebookTabProps {
  onStreakUpdated?: (streakCount: number) => void;
}

export const NotebookTab: React.FC<NotebookTabProps> = ({ onStreakUpdated }) => {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [sourceVal, setSourceVal] = useState("");
  const [tagsVal, setTagsVal] = useState("");
  const [showAdvanceAdd, setShowAdvanceAdd] = useState(false);
  const [selectedHistoryVocab, setSelectedHistoryVocab] = useState<any | null>(null);

  // Debounce keyword to prevent UI jitter on each keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // API calls
  const { data: vocabsData, isFetching: isVocabsLoading, refetch } = useGetVocabsQuery({
    page: 1,
    limit: 100,
    keyword: debouncedKeyword || undefined
  });

  // Xác định xem có bản ghi nào đang chờ phân tích AI hay không
  const hasAnalyzing = useMemo(() => {
    return vocabsData?.data?.some((v: any) => v.isAnalyzing) ?? false;
  }, [vocabsData]);

  // Tự động kích hoạt cơ chế Polling nhẹ (mỗi 1.5 giây) chỉ khi có bản ghi đang chờ phân tích AI
  useEffect(() => {
    if (hasAnalyzing) {
      const interval = setInterval(() => {
        refetch();
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [hasAnalyzing, refetch]);

  const [createVocab, { isLoading: isCreating }] = useCreateVocabMutation();
  const [deleteVocab] = useDeleteVocabMutation();

  // State Phân trang 6 records/page cho Notebook History
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when keyword changes
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword]);

  const notebookVocabs = useMemo(() => {
    if (!vocabsData?.data) return [];
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return vocabsData.data.filter((v: any) => {
      // Không hiển thị thẻ trên giao diện khi đang trong quá trình phân tích ngầm
      if (v.isAnalyzing) return false;

      const d = new Date(v.createdAt);
      const vStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return vStr === todayStr;
    });
  }, [vocabsData]);

  const paginatedNotebookVocabs = useMemo(() => {
    const start = (currentPage - 1) * 6;
    const end = start + 6;
    return notebookVocabs.slice(start, end);
  }, [notebookVocabs, currentPage]);

  // Thêm nhanh bằng AI
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    try {
      const tagsArray = tagsVal
        ? tagsVal.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];

      const payload = {
        originalInput: inputVal.trim(),
        source: sourceVal.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        aiModel: "gemini-3.1-flash-lite",
      };

      const result = await createVocab(payload).unwrap();

      if (result.success) {
        setInputVal("");
        setSourceVal("");
        setTagsVal("");
        setShowAdvanceAdd(false);

        // Chỉ hiện thông báo lưu thành công nếu không có hiệu ứng rực cháy của chuỗi ngày mới
        if (!result.streakUpdated) {
          notification.success({
            message: "Lưu từ vựng thành công",
            description: `Đã tự động phân tích và lưu từ "${result.data?.correctedWord || inputVal}".`,
            placement: "topRight"
          });
        }

        if (result.streakUpdated && onStreakUpdated) {
          onStreakUpdated(result.streakCount);
        }
      }
    } catch (err: any) {
      notification.error({
        message: "AI phân tích thất bại",
        description: err?.data?.message || "Vui lòng kiểm tra kết nối API Key.",
        placement: "topRight"
      });
    }
  };

  // Xóa từ vựng
  const handleDeleteVocab = async (id: string) => {
    try {
      await deleteVocab(id).unwrap();
      notification.success({
        message: "Xóa thành công",
        description: "Từ vựng đã được xóa khỏi sổ tay.",
        placement: "topRight"
      });
    } catch (err: any) {
      notification.error({
        message: "Lỗi xóa từ vựng",
        description: err?.data?.message || "Không thể thực hiện xóa lúc này.",
        placement: "topRight"
      });
    }
  };

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

  return (
    <div className="space-y-12 max-w-3xl mx-auto w-full pt-6">
      
      {/* Centered Greeting */}
      <div className="text-center space-y-6">
        <div className="space-y-2 flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-2xl flex items-center justify-center mb-1">
            <CompassOutlined className="text-blue-600 text-xl" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">What are we learning today?</h2>
          <p className="text-slate-400 text-xs font-semibold max-w-md">
            Enter a word, phrase, or grammar concept to translate, analyze, and add to your notebook.
          </p>
        </div>

        {/* Main quick add bar (Replaced with inline Loading card when isCreating is true or AI is still analyzing in background) */}
        {(isCreating || hasAnalyzing) ? (
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-gray-200/60 dark:border-slate-800/80 p-8 shadow-sm flex flex-col items-center justify-center space-y-4 animate-streak-pop max-w-xl mx-auto w-full min-h-[160px]">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-slate-100 dark:border-slate-800 border-t-blue-600 animate-spin" style={{ animationDuration: '0.8s' }} />
              <CompassOutlined className="absolute text-blue-600 text-sm animate-pulse" />
            </div>
            <div className="space-y-1 text-center">
              <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider block">AI is Analyzing</span>
              <p className="text-[9px] font-bold text-slate-400 max-w-xs leading-relaxed mb-0">Generating pronunciations, translations, and custom context sentences...</p>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleQuickAdd} className="relative w-full">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type something in any language..."
                className="w-full pl-5 pr-14 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-[#0056b3] dark:text-white text-xs font-bold"
              />
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreating}
                icon={!isCreating && <ArrowUpOutlined className="text-sm font-bold" />}
                className="absolute right-2 top-2 h-8 w-8 rounded-xl bg-[#0056b3] hover:bg-blue-700 border-none flex items-center justify-center"
              />
            </form>

            {/* Sub Options Toggle */}
            <div className="flex justify-center">
              <Button
                type="link"
                size="small"
                onClick={() => setShowAdvanceAdd(!showAdvanceAdd)}
                icon={<SettingOutlined className="text-xs" />}
                className="text-slate-400 hover:text-blue-600 text-[10px] font-bold p-0 flex items-center gap-1"
              >
                {showAdvanceAdd ? "Hide Options" : "Add Source context"}
              </Button>
            </div>

            {showAdvanceAdd && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-gray-200/50 dark:border-slate-800/80 text-left space-y-3 max-w-xl mx-auto w-full">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Source Context</span>
                  <input
                    type="text"
                    value={sourceVal}
                    onChange={(e) => setSourceVal(e.target.value)}
                    placeholder="e.g. Taking from news"
                    className="w-full px-2.5 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold focus:outline-none"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Today's History collapse segment */}
      <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-slate-900">
        <div className="flex items-center justify-between px-1 gap-4">
          <span className="text-xs font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5 shrink-0">
            <HistoryOutlined className="text-slate-400 text-xs" />
            Today's History
          </span>
          <div className="relative max-w-[200px] w-full">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search notebook..."
              className="w-full pl-8 pr-4 py-1.5 rounded-full border border-gray-200 dark:border-slate-800 bg-[#f8fafc]/80 dark:bg-slate-900 text-[10px] focus:outline-none dark:text-white font-semibold focus:ring-1 focus:ring-[#0056b3] transition-all"
            />
            <SearchOutlined className="absolute left-3 top-2 text-gray-400 text-[10px]" />
          </div>
        </div>

        {/* Today's items list */}
        <Spin spinning={isVocabsLoading} size="small">
        <div className="space-y-3" style={{ minHeight: 120 }}>
          {paginatedNotebookVocabs.length > 0 ? (
            paginatedNotebookVocabs.map((vocab: any) => {
              if (vocab.isAnalyzing) {
                return (
                  <div
                    key={vocab._id}
                    className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200/50 dark:border-slate-800/80 p-5 shadow-sm flex justify-between items-start select-none"
                  >
                    <div className="space-y-3 w-full pr-8">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-slate-800 dark:text-white leading-tight">{vocab.originalInput}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-900/50 border border-blue-100 dark:border-slate-800 px-1.5 py-0.5 rounded animate-pulse">
                          ✨ AI ANALYZING...
                        </span>
                      </div>
                      <div className="space-y-1.5 w-full">
                        <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-2/3 animate-pulse" />
                        <div className="h-3 bg-slate-50 dark:bg-slate-800/60 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={vocab._id}
                  onClick={() => setSelectedHistoryVocab(vocab)}
                  className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200/50 dark:border-slate-800/80 p-5 shadow-sm flex justify-between items-start transition-all hover:border-gray-300 dark:hover:border-slate-700 cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-800 dark:text-white">{vocab.correctedWord}</span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {vocab.category || "Vocabulary"}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 mb-0">
                      {vocab.meaningEn}
                    </p>
                    <p className="text-[11px] font-bold text-slate-400 mb-0">
                      {vocab.meaningVi}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="text"
                      shape="circle"
                      size="small"
                      icon={<SoundOutlined className="text-slate-400 hover:text-blue-600 text-xs" />}
                      onClick={(e) => { e.stopPropagation(); playVocabSpeech(vocab.correctedWord, "en-US"); }}
                      className="flex items-center justify-center bg-slate-50 dark:bg-slate-800"
                    />
                    <Popconfirm
                      title="Xóa khỏi notebook?"
                      onConfirm={() => handleDeleteVocab(vocab._id)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <Button
                        type="text"
                        shape="circle"
                        size="small"
                        icon={<DeleteOutlined className="text-slate-400 hover:text-red-500 text-xs" />}
                        className="flex items-center justify-center bg-slate-50 dark:bg-slate-800"
                      />
                    </Popconfirm>
                  </div>
                </div>
              );
            })
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-slate-400 text-xs font-semibold">Notebook trống. Nhập từ vựng ở trên để bắt đầu!</span>} />
          )}
        </div>
        </Spin>

        {/* Phân trang 6 records/page cho Notebook */}
        {notebookVocabs.length > 6 && (
          <div className="flex justify-center pt-6 pb-2">
            <Pagination
              current={currentPage}
              pageSize={6}
              total={notebookVocabs.length}
              onChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              showSizeChanger={false}
              size="small"
              className="premium-pagination"
            />
          </div>
        )}
      </div>

      <Modal
        open={!!selectedHistoryVocab}
        onCancel={() => setSelectedHistoryVocab(null)}
        footer={null}
        destroyOnClose
        centered
        width={768}
        styles={{
          body: {
            padding: "24px 16px 16px 16px",
          }
        }}
        className="premium-vocab-modal select-none"
      >
        {selectedHistoryVocab && (
          <div className="space-y-4 text-left">
            <div className="flex items-center flex-wrap gap-2 w-full pt-2">
              <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                {selectedHistoryVocab.correctedWord}
              </span>
              
              <Button
                type="text"
                shape="circle"
                size="small"
                icon={<SoundOutlined className="text-slate-400 hover:text-blue-600 text-xs" />}
                onClick={() => playVocabSpeech(selectedHistoryVocab.correctedWord, "en-US")}
                className="flex items-center justify-center bg-slate-50 dark:bg-slate-800"
              />

              {selectedHistoryVocab.pronunciationUK && (
                <span className="text-xs font-semibold text-slate-400">
                  {selectedHistoryVocab.pronunciationUK}
                </span>
              )}

              {/* Topic Hashtags badges */}
              <div className="flex items-center gap-1.5 ml-2">
                {selectedHistoryVocab.tags && selectedHistoryVocab.tags.filter((t: string) => !isPartOfSpeechTag(t)).map((tag: string) => (
                  <span key={tag} className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-slate-900 border border-indigo-100/40 dark:border-indigo-800/40 px-2 py-0.5 rounded-full uppercase">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Part of Speech & Level Ribbons Row */}
            {(selectedHistoryVocab.partOfSpeech || selectedHistoryVocab.level) && (
              <div className="flex items-center gap-2">
                {selectedHistoryVocab.partOfSpeech && (
                  <div className="w-fit bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase">
                    {getShorthandPOS(selectedHistoryVocab.partOfSpeech)}
                  </div>
                )}
                {selectedHistoryVocab.level && (
                  <div className={`w-fit px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${getLevelBadgeColor(selectedHistoryVocab.level)}`}>
                    {selectedHistoryVocab.level.toUpperCase()}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold leading-relaxed mb-0">
                {selectedHistoryVocab.meaningVi}
              </p>
              {selectedHistoryVocab.meaningEn && (
                <p className="text-slate-400 text-xs italic font-medium mb-0">
                  {selectedHistoryVocab.meaningEn}
                </p>
              )}
            </div>

            {selectedHistoryVocab.examples?.length > 0 && (
              <div className="border-l-2 border-blue-500 pl-4 py-1 space-y-3 bg-slate-50/20 dark:bg-slate-900/10 rounded-r-xl">
                {selectedHistoryVocab.examples.map((item: any, idx: number) => (
                  <div key={idx} className="space-y-0.5 text-xs text-left">
                    <p
                      className="text-slate-700 dark:text-slate-300 font-semibold mb-0"
                      dangerouslySetInnerHTML={{ __html: formatExampleSentence(item.sentence, selectedHistoryVocab.correctedWord) }}
                    />
                    <p className="text-slate-400 text-[10px] font-bold mb-0">
                      {item.translation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>



    </div>
  );
};
