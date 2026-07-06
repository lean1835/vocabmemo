import React, { useState, useMemo, useEffect } from "react";
import { Button, Select, Spin, Empty, notification, Form, Input, Dropdown, Pagination } from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SoundOutlined,
  CloseOutlined,
  EllipsisOutlined
} from "@ant-design/icons";
import { playVocabSpeech } from "../services/tts";
import {
  useGetVocabsQuery,
  useGetVocabMetadataQuery,
  useDeleteVocabMutation,
  useUpdateVocabMutation
} from "../services/vocabApi";

export const ArchiveTab: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [selectedPOS, setSelectedPOS] = useState<string | undefined>(undefined);
  const [archiveSelectedTag, setArchiveSelectedTag] = useState<string | undefined>(undefined);
  const [archiveSelectedDate, setArchiveSelectedDate] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce keyword to prevent UI jitter on each keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Reset page when keyword or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedKeyword, selectedPOS, archiveSelectedTag, archiveSelectedDate]);

  // State Chỉnh sửa inline trực tiếp
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm] = Form.useForm();

  // API calls
  const { data: vocabsData, isLoading: isVocabsLoadingInitial, isFetching: isVocabsLoading } = useGetVocabsQuery({
    page: 1,
    limit: 10000,
    keyword: debouncedKeyword || undefined
  });

  const { data: metadataData } = useGetVocabMetadataQuery();
  const [deleteVocab] = useDeleteVocabMutation();
  const [updateVocab, { isLoading: isUpdating }] = useUpdateVocabMutation();

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

  const tagsList = useMemo(() => {
    const rawTags = metadataData?.data?.tags || [];
    return rawTags.filter((tag: string) => !isPartOfSpeechTag(tag));
  }, [metadataData]);

  // Lấy danh sách các ngày học duy nhất có chứa từ vựng
  const uniqueDatesList = useMemo(() => {
    if (!vocabsData?.data) return [];
    const dates = vocabsData.data.map((v: any) => {
      const d = new Date(v.createdAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
    return Array.from(new Set(dates)).sort((a: any, b: any) => b.localeCompare(a)) as string[];
  }, [vocabsData]);

  // 1. Phễu lọc toàn bộ danh sách Archive theo bộ lọc
  const allFilteredVocabs = useMemo(() => {
    if (!vocabsData?.data) return [];
    let list = vocabsData.data;

    // Lọc theo POS nếu có chọn lọc loại từ
    if (selectedPOS) {
      list = list.filter((v: any) => v.partOfSpeech?.toLowerCase().includes(selectedPOS.toLowerCase()));
    }
    if (archiveSelectedTag) {
      list = list.filter((v: any) => v.tags && v.tags.includes(archiveSelectedTag));
    }
    if (archiveSelectedDate) {
      list = list.filter((v: any) => {
        const d = new Date(v.createdAt);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return dStr === archiveSelectedDate;
      });
    }
    return list;
  }, [vocabsData, selectedPOS, archiveSelectedTag, archiveSelectedDate]);

  // 2. Phân trang 6 records/page
  const paginatedVocabs = useMemo(() => {
    const start = (currentPage - 1) * 6;
    const end = start + 6;
    return allFilteredVocabs.slice(start, end);
  }, [allFilteredVocabs, currentPage]);

  // 3. Nhóm từ vựng theo ngày tạo (chỉ nhóm 6 từ của trang hiện tại để giữ vững timeline)
  const groupedVocabs = useMemo<Record<string, any[]>>(() => {
    const groups: { [key: string]: any[] } = {};

    paginatedVocabs.forEach((vocab: any) => {
      const date = new Date(vocab.createdAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(vocab);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    const sortedGroups: { [key: string]: any[] } = {};
    sortedKeys.forEach((key) => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [paginatedVocabs]);

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

  // Kích hoạt chế độ chỉnh sửa inline
  const startInlineEdit = (vocab: any) => {
    setEditingId(vocab._id);
    editForm.setFieldsValue({
      meaningVi: vocab.meaningVi,
      meaningEn: vocab.meaningEn,
      partOfSpeech: vocab.partOfSpeech,
      pronunciationUK: vocab.pronunciationUK,
      pronunciationUS: vocab.pronunciationUS,
      level: vocab.level,
      category: vocab.category,
      tags: vocab.tags?.join(", ") || "",
    });
  };

  // Lưu chỉnh sửa inline
  const handleUpdateVocab = async (id: string) => {
    try {
      const values = await editForm.validateFields();
      const tagsArray = values.tags
        ? values.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];

      const body = {
        meaningVi: values.meaningVi,
        meaningEn: values.meaningEn,
        partOfSpeech: values.partOfSpeech,
        pronunciationUK: values.pronunciationUK,
        pronunciationUS: values.pronunciationUS,
        level: values.level,
        category: values.category,
        tags: tagsArray,
      };

      await updateVocab({ id, body }).unwrap();
      setEditingId(null);
      notification.success({
        message: "Đã cập nhật",
        description: "Thông tin từ vựng đã được lưu lại trực tiếp.",
        placement: "topRight"
      });
    } catch (err: any) {
      notification.error({
        message: "Lỗi cập nhật",
        description: "Vui lòng điền đủ thông tin.",
        placement: "topRight"
      });
    }
  };

  return (
    <div className="space-y-6 pt-4 max-w-4xl mx-auto w-full">
      
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Archive</h2>
        <p className="text-slate-400 text-xs font-semibold">A quiet place for words you've mastered. They remain here for reference but won't appear in active practice sessions.</p>
        <div className="relative max-w-sm w-full pt-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search archive..."
            className="w-full pl-8 pr-4 py-1.5 rounded-full border border-gray-200 dark:border-slate-800 bg-[#f8fafc]/80 dark:bg-slate-900 text-xs focus:outline-none dark:text-white font-semibold focus:ring-1 focus:ring-[#0056b3] transition-all"
          />
          <SearchOutlined className="absolute left-3 top-4 text-gray-400 text-xs" />
        </div>
      </div>

      {/* List counter & filter pills toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-slate-900">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
          List có {allFilteredVocabs.length || 0} từ
        </span>

        <div className="flex flex-wrap items-center gap-3">
          {/* Lọc theo ngày tháng */}
          <Select
            placeholder="Lọc theo ngày"
            allowClear
            style={{ width: 160 }}
            value={archiveSelectedDate}
            onChange={(val) => setArchiveSelectedDate(val)}
            size="middle"
            className="custom-select-archive text-xs font-bold"
          >
            {uniqueDatesList.map((dateStr) => (
              <Select.Option key={dateStr} value={dateStr}>
                {getFriendlyDateLabel(dateStr)}
              </Select.Option>
            ))}
          </Select>

          {/* Lọc theo chủ đề */}
          <Select
            placeholder="Lọc theo chủ đề"
            allowClear
            style={{ width: 160 }}
            value={archiveSelectedTag}
            onChange={(val) => setArchiveSelectedTag(val)}
            size="middle"
            className="custom-select-archive text-xs font-bold"
          >
            {tagsList.map((tag: string) => (
              <Select.Option key={tag} value={tag}>
                #{tag}
              </Select.Option>
            ))}
          </Select>

          {/* Filter POS pills */}
          <div className="flex gap-1.5 border-l border-gray-200 dark:border-slate-800 pl-3">
            <button
              onClick={() => setSelectedPOS(undefined)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                !selectedPOS
                  ? "bg-[#0056b3] text-white border-none shadow-sm"
                  : "bg-white dark:bg-[#1c1c1e] text-slate-500 border-gray-200 dark:border-slate-800 hover:bg-gray-50"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedPOS("noun")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                selectedPOS === "noun"
                  ? "bg-[#0056b3] text-white border-none shadow-sm"
                  : "bg-white dark:bg-[#1c1c1e] text-slate-500 border-gray-200 dark:border-slate-800 hover:bg-gray-50"
              }`}
            >
              Nouns
            </button>
            <button
              onClick={() => setSelectedPOS("verb")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                selectedPOS === "verb"
                  ? "bg-[#0056b3] text-white border-none shadow-sm"
                  : "bg-white dark:bg-[#1c1c1e] text-slate-500 border-gray-200 dark:border-slate-800 hover:bg-gray-50"
              }`}
            >
              Verbs
            </button>
            <button
              onClick={() => setSelectedPOS("adjective")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                selectedPOS === "adjective"
                  ? "bg-[#0056b3] text-white border-none shadow-sm"
                  : "bg-white dark:bg-[#1c1c1e] text-slate-500 border-gray-200 dark:border-slate-800 hover:bg-gray-50"
              }`}
            >
              Adjectives
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Archive timeline entries */}
      <Spin spinning={isVocabsLoading && !isVocabsLoadingInitial}>
      <div className="space-y-8 pt-4" style={{ minHeight: 200 }}>
        {Object.keys(groupedVocabs).length > 0 ? (
          Object.entries(groupedVocabs).map(([dateStr, vocabs]) => (
            <div key={dateStr} className="space-y-4">
              
              {/* Timeline Banner */}
              <span className="text-lg font-black text-slate-800 dark:text-white tracking-tight block border-b border-gray-100 dark:border-slate-900 pb-1.5">
                {getFriendlyDateLabel(dateStr)}
              </span>

              {/* Cards list */}
              <div className="space-y-4">
                {vocabs.map((vocab: any) => {
                  const isEditing = editingId === vocab._id;
                  return (
                    <div
                      key={vocab._id}
                      className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-gray-200/50 dark:border-slate-800/80 p-6 shadow-sm flex flex-col space-y-4 transition-all"
                    >
                      {/* EDITING CARD INLINE */}
                      {isEditing ? (
                        <Form form={editForm} layout="vertical" className="space-y-3">
                          <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-2 mb-2">
                            <span className="text-xs font-black text-blue-600">✏️ EDIT VOCABULARY INLINE</span>
                            <Button size="small" type="text" icon={<CloseOutlined />} onClick={() => setEditingId(null)} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Form.Item label="Từ loại" name="partOfSpeech">
                              <Input className="rounded-lg" />
                            </Form.Item>
                            <Form.Item label="Mức độ" name="level">
                              <Select options={["A1", "A2", "B1", "B2", "C1", "C2"].map(l => ({ value: l, label: l }))} />
                            </Form.Item>
                          </div>
                          <Form.Item label="Định nghĩa Việt" name="meaningVi" rules={[{ required: true }]}>
                            <Input className="rounded-lg" />
                          </Form.Item>
                          <Form.Item label="Định nghĩa Anh" name="meaningEn">
                            <Input className="rounded-lg" />
                          </Form.Item>
                          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-900">
                            <Button size="small" onClick={() => setEditingId(null)}>Hủy</Button>
                            <Button size="small" type="primary" loading={isUpdating} onClick={() => handleUpdateVocab(vocab._id)} className="bg-blue-600 hover:bg-blue-700 border-none font-bold text-xs rounded-lg">Lưu lại</Button>
                          </div>
                        </Form>
                      ) : (
                        /* NORMAL ARCHIVE CARD */
                        <div className="space-y-4">
                          
                          {/* Top Row: Word, speaker, ipa, level, category, meatball */}
                          <div className="flex items-center flex-wrap gap-2 w-full">
                            <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{vocab.correctedWord}</span>
                            <Button
                              type="text"
                              shape="circle"
                              size="small"
                              icon={<SoundOutlined className="text-slate-400 hover:text-blue-600 text-xs" />}
                              onClick={() => playVocabSpeech(vocab.correctedWord, "en-US")}
                              className="flex items-center justify-center bg-slate-50 dark:bg-slate-800"
                            />
                            {vocab.pronunciationUK && (
                              <span className="text-xs font-semibold text-slate-400">{vocab.pronunciationUK}</span>
                            )}

                            {/* Topic Hashtags badges */}
                            <div className="flex items-center gap-1.5 ml-2">
                              {vocab.tags && vocab.tags.filter((t: string) => !isPartOfSpeechTag(t)).map((tag: string) => (
                                <span key={tag} className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-slate-900 border border-indigo-100/40 dark:border-indigo-800/40 px-2 py-0.5 rounded-full uppercase">
                                  #{tag}
                                </span>
                              ))}
                            </div>

                            {/* Meatball Actions */}
                            <Dropdown
                              menu={{
                                items: [
                                  { key: "edit", label: "Chỉnh sửa", icon: <EditOutlined />, onClick: () => startInlineEdit(vocab) },
                                  {
                                    key: "delete",
                                    label: "Xóa từ",
                                    icon: <DeleteOutlined />,
                                    danger: true,
                                    onClick: () => handleDeleteVocab(vocab._id)
                                  }
                                ]
                              }}
                              placement="bottomRight"
                              arrow
                            >
                              <Button
                                type="text"
                                shape="circle"
                                size="small"
                                icon={<EllipsisOutlined className="text-gray-400 hover:text-slate-800 text-sm" />}
                                className="ml-auto flex items-center justify-center"
                              />
                            </Dropdown>
                          </div>

                          {/* Part of Speech & Level Ribbons Row */}
                          {(vocab.partOfSpeech || vocab.level) && (
                            <div className="flex items-center gap-2">
                              {vocab.partOfSpeech && (
                                <div className="w-fit bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase">
                                  {getShorthandPOS(vocab.partOfSpeech)}
                                </div>
                              )}
                              {vocab.level && (
                                <div className={`w-fit px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${getLevelBadgeColor(vocab.level)}`}>
                                  {vocab.level.toUpperCase()}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Translations */}
                          <div className="space-y-1.5">
                            <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold leading-relaxed mb-0">
                              {vocab.meaningVi}
                            </p>
                            {vocab.meaningEn && (
                              <p className="text-slate-400 text-xs italic font-medium mb-0">
                                {vocab.meaningEn}
                              </p>
                            )}
                          </div>

                          {/* Examples section with vertical blue border on left */}
                          {vocab.examples?.length > 0 && (
                            <div className="border-l-2 border-blue-500 pl-4 py-1 space-y-3 bg-slate-50/20 dark:bg-slate-900/10 rounded-r-xl">
                              {vocab.examples.map((item: any, idx: number) => (
                                <div key={idx} className="space-y-0.5 text-xs">
                                  <p
                                    className="text-slate-700 dark:text-slate-300 font-semibold mb-0"
                                    dangerouslySetInnerHTML={{ __html: formatExampleSentence(item.sentence, vocab.correctedWord) }}
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
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-white dark:bg-[#1c1c1e] rounded-3xl border border-gray-200/40 dark:border-slate-800/40 shadow-sm">
            <Empty description={<span className="text-slate-400 text-xs font-semibold">Archive trống.</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )}
      </div>
      </Spin>

      {/* End of Archive Indicator */}
      <div className="text-center py-12 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
        <span>End of Archive</span>
        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
      </div>

      {/* Phân trang 6 records/page cho Archive */}
      {allFilteredVocabs.length > 6 && (
        <div className="flex justify-center pt-8 pb-4">
          <Pagination
            current={currentPage}
            pageSize={6}
            total={allFilteredVocabs.length}
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
  );
};
