import React, { useState, useMemo, useEffect } from "react";
import { Button, Spin, Empty, notification, Form, Input, Dropdown, Pagination } from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SoundOutlined,
  CloseOutlined,
  CheckOutlined,
  EllipsisOutlined
} from "@ant-design/icons";
import { playVocabSpeech } from "../services/tts";
import {
  useGetVocabsQuery,
  useDeleteVocabMutation,
  useUpdateVocabMutation
} from "../services/vocabApi";

export const DifficultTab: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce keyword to prevent UI jitter on each keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Reset page when keyword changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedKeyword]);

  // State Chỉnh sửa inline trực tiếp
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm] = Form.useForm();

  // API calls
  const { data: vocabsData, isLoading: isVocabsLoadingInitial, isFetching: isVocabsLoading } = useGetVocabsQuery({
    page: 1,
    limit: 100,
    keyword: debouncedKeyword || undefined
  });

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

  // Lọc chỉ các từ khó (isDifficult === true)
  const difficultVocabs = useMemo(() => {
    if (!vocabsData?.data) return [];
    return vocabsData.data.filter((v: any) => v.isDifficult === true);
  }, [vocabsData]);

  // Phân trang 6 record 1 trang
  const paginatedVocabs = useMemo(() => {
    const start = (currentPage - 1) * 6;
    const end = start + 6;
    return difficultVocabs.slice(start, end);
  }, [difficultVocabs, currentPage]);

  // Định dạng in đậm từ khóa trong ví dụ
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

  // Chuyển từ thành Dễ (Đã thuộc)
  const handleMarkAsEasy = async (id: string, word: string) => {
    try {
      await updateVocab({ id, body: { isDifficult: false } }).unwrap();
      notification.success({
        message: "Đã đánh dấu Dễ (Đã thuộc)",
        description: `Từ "${word}" đã được chuyển ra khỏi danh sách từ khó.`,
        placement: "topRight"
      });
    } catch (err: any) {
      notification.error({
        message: "Lỗi cập nhật",
        description: "Không thể cập nhật độ khó lúc này.",
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
        description: "Thông tin từ vựng đã được lưu lại.",
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
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Difficult Words</h2>
        <p className="text-slate-400 text-xs font-semibold">
          Nơi tập hợp những từ vựng bạn hay quên hoặc đánh giá là khó học. Hãy luyện tập thường xuyên để làm chủ chúng.
        </p>
        <div className="relative max-w-sm w-full pt-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search difficult words..."
            className="w-full pl-8 pr-4 py-1.5 rounded-full border border-gray-200 dark:border-slate-800 bg-[#f8fafc]/80 dark:bg-slate-900 text-xs focus:outline-none dark:text-white font-semibold focus:ring-1 focus:ring-[#0056b3] transition-all"
          />
          <SearchOutlined className="absolute left-3 top-4 text-gray-400 text-xs" />
        </div>
      </div>

      {/* List counter */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-900">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
          Có {difficultVocabs.length} từ hay quên
        </span>
      </div>

      <Spin spinning={isVocabsLoading && !isVocabsLoadingInitial}>
      <div className="space-y-4 pt-2" style={{ minHeight: 200 }}>
        {paginatedVocabs.length > 0 ? (
          paginatedVocabs.map((vocab: any) => {
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
                        <Input className="rounded-lg" />
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
                  /* NORMAL CARD */
                  <div className="space-y-4">
                    {/* Top Row: Word, speaker, ipa, tags, easy toggle button, meatball */}
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

                      {/* Directly Mark as Easy Button */}
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined className="text-emerald-500" />}
                        onClick={() => handleMarkAsEasy(vocab._id, vocab.correctedWord)}
                        className="ml-auto bg-emerald-50 dark:bg-slate-900 hover:bg-emerald-100 border border-emerald-100/30 text-emerald-600 text-[10px] font-bold px-3 py-1 rounded-xl flex items-center justify-center gap-1"
                      >
                        Đã thuộc (Easy)
                      </Button>

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
                          className="flex items-center justify-center"
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

                    {/* Examples section */}
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
          })
        ) : (
          <div className="py-20 text-center bg-white dark:bg-[#1c1c1e] rounded-3xl border border-gray-200/40 dark:border-slate-800/40 shadow-sm">
            <Empty description={<span className="text-slate-400 text-xs font-semibold">Chưa có từ vựng khó nào.</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )}
      </div>
      </Spin>

      {/* Phân trang 6 records/page cho Difficult Words */}
      {difficultVocabs.length > 6 && (
        <div className="flex justify-center pt-8 pb-4">
          <Pagination
            current={currentPage}
            pageSize={6}
            total={difficultVocabs.length}
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
