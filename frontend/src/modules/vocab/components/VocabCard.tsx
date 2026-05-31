import React from "react";
import { Card, Button, Space, Typography, Popconfirm } from "antd";
import { SoundOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { playVocabSpeech } from "../services/tts";

const { Text, Paragraph } = Typography;

interface VocabCardProps {
  vocab: {
    _id: string;
    originalInput: string;
    correctedWord: string;
    pronunciationUK: string;
    pronunciationUS: string;
    partOfSpeech: string;
    meaningVi: string;
    meaningEn: string;
    examples: Array<{ sentence: string; translation: string }>;
    synonyms: string[];
    level: string;
    category: string;
    source?: string;
    tags: string[];
    imageUrl: string;
  };
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: () => void;
}

// Chuyển đổi từ loại sang dạng viết tắt chuẩn từ điển
const getShorthandPOS = (pos: string) => {
  const cleanPos = pos?.toLowerCase().trim();
  if (cleanPos?.includes("noun")) return "n";
  if (cleanPos?.includes("verb")) return "v";
  if (cleanPos?.includes("adjective") || cleanPos?.includes("adj")) return "adj";
  if (cleanPos?.includes("adverb") || cleanPos?.includes("adv")) return "adv";
  return pos;
};

export const VocabCard: React.FC<VocabCardProps> = ({ vocab, onClick, onEdit, onDelete }) => {
  // Tránh click card kích hoạt phát âm khi bấm loa
  const handleVoicePlay = (e: React.MouseEvent, accent: "en-GB" | "en-US", text: string) => {
    e.stopPropagation();
    playVocabSpeech(text, accent);
  };

  // Định dạng lại các câu ví dụ: tô đậm và nhuộm màu từ trong ngoặc vuông [...]
  const formatSentence = (sentence: string) => {
    if (!sentence) return "";
    const regex = /\[(.*?)\]/g;
    return sentence.replace(regex, '<span class="font-extrabold text-[#7c4dff] dark:text-purple-300">$1</span>');
  };

  const hasImage = !!vocab.imageUrl;

  return (
    <Card
      onClick={onClick}
      className="rounded-2xl border border-gray-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-800 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 dark:hover:shadow-none hover-lift cursor-pointer overflow-hidden p-0"
      styles={{ body: { padding: "24px" } }}
    >
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
        {/* Cột trái: Chi tiết văn bản từ vựng */}
        <div className="flex-1 w-full">
          {/* Header: từ vựng + từ loại + IPA + CRUD nhanh */}
          <div className="flex items-center flex-wrap gap-2.5 mb-4 w-full">
            <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
              {vocab.correctedWord}
            </span>
            {vocab.partOfSpeech && (
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                ({getShorthandPOS(vocab.partOfSpeech)})
              </span>
            )}
            
            {vocab.pronunciationUK && (
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {vocab.pronunciationUK}
              </span>
            )}

            {/* Cặp loa phát âm riêng biệt UK/US */}
            <Space size={2} className="ml-1">
              <Button
                type="text"
                shape="circle"
                size="small"
                icon={<SoundOutlined className="text-[#7c4dff] dark:text-purple-300 text-xs" />}
                onClick={(e) => handleVoicePlay(e, "en-GB", vocab.correctedWord)}
                className="hover:bg-purple-50 dark:hover:bg-purple-950/20 flex items-center justify-center"
              />
              <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 mr-2">UK</span>

              <Button
                type="text"
                shape="circle"
                size="small"
                icon={<SoundOutlined className="text-blue-500 text-xs" />}
                onClick={(e) => handleVoicePlay(e, "en-US", vocab.correctedWord)}
                className="hover:bg-blue-50 dark:hover:bg-blue-950/20 flex items-center justify-center"
              />
              <span className="text-[10px] font-black text-gray-400 dark:text-slate-500">US</span>
            </Space>

            {/* Cặp nút CRUD nhanh: Sửa & Xóa trực tiếp trên Card */}
            <div className="flex gap-1 ml-auto" onClick={(e) => e.stopPropagation()}>
              <Button
                type="text"
                shape="circle"
                size="small"
                icon={<EditOutlined className="text-gray-400 hover:text-[#7c4dff] text-xs" />}
                onClick={onEdit}
                className="hover:bg-purple-50 dark:hover:bg-purple-950/20 flex items-center justify-center"
              />
              <Popconfirm
                title="Xóa từ vựng"
                description="Bạn có chắc chắn muốn xóa từ này?"
                onConfirm={onDelete}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true, size: "small" }}
                cancelButtonProps={{ size: "small" }}
              >
                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  icon={<DeleteOutlined className="text-gray-400 hover:text-red-500 text-xs" />}
                  className="hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center"
                />
              </Popconfirm>
            </div>
          </div>

          {/* Định nghĩa */}
          <div className="mb-4">
            <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Định nghĩa:
            </h4>
            <p className="text-slate-800 dark:text-slate-200 text-base font-semibold leading-relaxed mb-0.5">
              {vocab.meaningVi}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm italic leading-relaxed">
              {vocab.meaningEn}
            </p>
          </div>

          {/* Ví dụ minh họa */}
          {vocab.examples?.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Ví dụ:
              </h4>
              <ul className="space-y-2 pl-0 list-none mb-0">
                {vocab.examples.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <Button
                      type="text"
                      shape="circle"
                      size="small"
                      icon={<SoundOutlined className="text-gray-400 hover:text-[#7c4dff] text-xs" />}
                      onClick={(e) => handleVoicePlay(e, "en-US", item.sentence.replace(/[\[\]]/g, ""))}
                      className="flex items-center justify-center mt-0.5"
                    />
                    <div>
                      <span
                        dangerouslySetInnerHTML={{ __html: formatSentence(item.sentence) }}
                      />{" "}
                      <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">
                        (=Dịch: {item.translation})
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Cột phải: Ảnh minh họa (Illustration) hiển thị phẳng */}
        {hasImage && (
          <div className="w-full md:w-[180px] h-[130px] rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-center self-center shrink-0">
            <img
              src={vocab.imageUrl}
              alt={vocab.correctedWord}
              className="w-full h-full object-cover opacity-90 dark:opacity-80"
              onError={(e) => {
                // Fallback nếu ảnh lỗi
                (e.target as any).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Footer metadata nhỏ */}
      <div className="flex justify-between items-center mt-5 pt-3 border-t border-gray-100 dark:border-slate-800/40">
        <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          {vocab.category || "General"}
        </span>
        <Space size={4}>
          {vocab.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-extrabold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md"
            >
              #{tag}
            </span>
          ))}
        </Space>
      </div>
    </Card>
  );
};

export default VocabCard;
