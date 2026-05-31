import React, { useState, useEffect } from "react";
import { Drawer, Button, Space, Tag, Typography, Form, Input, notification, Popconfirm } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  SoundOutlined,
  BookOutlined,
  TagOutlined
} from "@ant-design/icons";
import { useUpdateVocabMutation, useDeleteVocabMutation } from "../services/vocabApi";
import { playVocabSpeech } from "../services/tts";

const { Paragraph, Text } = Typography;

interface VocabDetailDrawerProps {
  vocab: any;
  visible: boolean;
  onClose: () => void;
  defaultEditMode?: boolean;
}

export const VocabDetailDrawer: React.FC<VocabDetailDrawerProps> = ({ vocab, visible, onClose, defaultEditMode = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  
  const [updateVocab, { isLoading: isUpdating }] = useUpdateVocabMutation();
  const [deleteVocab, { isLoading: isDeleting }] = useDeleteVocabMutation();

  useEffect(() => {
    if (vocab) {
      form.setFieldsValue({
        meaningVi: vocab.meaningVi,
        meaningEn: vocab.meaningEn,
        source: vocab.source,
        tags: vocab.tags?.join(", ") || "",
      });
    }
    setIsEditing(!!defaultEditMode);
  }, [vocab, form, visible, defaultEditMode]);

  if (!vocab) return null;

  const isCorrected = vocab.originalInput?.toLowerCase().trim() !== vocab.correctedWord?.toLowerCase().trim();

  const handleVoicePlay = (accent: "en-GB" | "en-US", text: string) => {
    playVocabSpeech(text, accent);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      
      const tagsArray = values.tags
        ? values.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];

      const body = {
        meaningVi: values.meaningVi,
        meaningEn: values.meaningEn,
        source: values.source,
        tags: tagsArray,
      };

      await updateVocab({ id: vocab._id, body }).unwrap();
      setIsEditing(false);

      notification.success({
        message: "Cập nhật thành công",
        description: "Thông tin từ vựng đã được cập nhật.",
        placement: "topRight",
        className: "rounded-xl font-sans"
      });
    } catch (error) {
      notification.error({
        message: "Lỗi cập nhật",
        description: "Vui lòng kiểm tra lại dữ liệu nhập vào.",
        placement: "topRight",
        className: "rounded-xl font-sans"
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteVocab(vocab._id).unwrap();
      onClose();
      notification.success({
        message: "Đã xóa từ vựng",
        description: "Từ vựng đã được loại bỏ khỏi danh sách của bạn.",
        placement: "topRight",
        className: "rounded-xl font-sans"
      });
    } catch (error) {
      notification.error({
        message: "Lỗi khi xóa",
        description: "Không thể xóa từ vựng này. Vui lòng thử lại sau.",
        placement: "topRight",
        className: "rounded-xl font-sans"
      });
    }
  };

  // Định dạng bọc từ ngoặc vuông [...]
  const formatSentence = (sentence: string) => {
    if (!sentence) return "";
    const regex = /\[(.*?)\]/g;
    return sentence.replace(regex, '<span class="font-extrabold text-[#7c4dff] dark:text-purple-300">$1</span>');
  };

  return (
    <Drawer
      title={
        <div className="flex justify-between items-center w-full pr-8">
          <span className="text-lg font-black bg-gradient-purple bg-clip-text text-transparent">
            Chi tiết từ vựng
          </span>
          <Space>
            {isEditing ? (
              <>
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl flex items-center justify-center"
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={isUpdating}
                  onClick={handleUpdate}
                  className="bg-gradient-purple border-none rounded-xl flex items-center justify-center"
                >
                  Lưu
                </Button>
              </>
            ) : (
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl flex items-center justify-center border-[#7c4dff] text-[#7c4dff] hover:bg-purple-50"
                >
                  Chỉnh sửa
                </Button>
                <Popconfirm
                  title="Xóa từ vựng"
                  description="Bạn có chắc chắn muốn xóa từ này khỏi danh sách?"
                  onConfirm={handleDelete}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true, loading: isDeleting }}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    className="rounded-xl flex items-center justify-center"
                  >
                    Xóa từ
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        </div>
      }
      placement="right"
      width={window.innerWidth > 640 ? 560 : "100%"}
      onClose={onClose}
      open={visible}
      className="dark:bg-slate-900 font-sans"
      styles={{ body: { padding: "24px" } }}
    >
      {/* 1. Header Details */}
      <div className="border-b border-gray-100 dark:border-slate-800/60 pb-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                {vocab.correctedWord}
              </h2>
            </div>
            
            {/* Phiên âm UK/US riêng biệt */}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {vocab.pronunciationUK && (
                <Space size={4}>
                  <Button
                    type="text"
                    shape="circle"
                    size="small"
                    icon={<SoundOutlined className="text-[#7c4dff]" />}
                    onClick={() => handleVoicePlay("en-GB", vocab.correctedWord)}
                    className="hover:bg-purple-50 flex items-center justify-center"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    UK: <span className="font-semibold italic">{vocab.pronunciationUK}</span>
                  </span>
                </Space>
              )}

              {vocab.pronunciationUS && (
                <Space size={4}>
                  <Button
                    type="text"
                    shape="circle"
                    size="small"
                    icon={<SoundOutlined className="text-blue-500" />}
                    onClick={() => handleVoicePlay("en-US", vocab.correctedWord)}
                    className="hover:bg-blue-50 flex items-center justify-center"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    US: <span className="font-semibold italic">{vocab.pronunciationUS}</span>
                  </span>
                </Space>
              )}
            </div>
          </div>

          <Space size="small" className="flex-wrap">
            <Tag color="purple" className="rounded-md font-bold uppercase border-none px-2.5 py-1">
              {vocab.partOfSpeech}
            </Tag>
            <Tag color="blue" className="rounded-md font-extrabold border-none px-2.5 py-1">
              {vocab.level}
            </Tag>
          </Space>
        </div>

        {isCorrected && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-medium border border-emerald-100 dark:border-emerald-900/30">
            💡 AI tự động sửa lỗi chính tả từ đầu vào ban đầu:{" "}
            <Text delete className="text-emerald-600/70 dark:text-emerald-400/60 font-semibold">
              "{vocab.originalInput}"
            </Text>{" "}
            → <span className="font-bold">"{vocab.correctedWord}"</span>
          </div>
        )}
      </div>

      {/* Minh họa hình ảnh trong Drawer */}
      {vocab.imageUrl && !isEditing && (
        <div className="w-full h-[180px] rounded-2xl overflow-hidden mb-6 border border-gray-100 dark:border-slate-800">
          <img src={vocab.imageUrl} alt={vocab.correctedWord} className="w-full h-full object-cover" />
        </div>
      )}

      {/* 2. Content Details */}
      {isEditing ? (
        <Form form={form} layout="vertical" className="font-sans">
          <Form.Item
            name="meaningVi"
            label={<span className="font-bold text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Nghĩa tiếng Việt</span>}
            rules={[{ required: true, message: "Vui lòng điền nghĩa tiếng Việt!" }]}
          >
            <Input.TextArea rows={2} className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </Form.Item>

          <Form.Item
            name="meaningEn"
            label={<span className="font-bold text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Định nghĩa tiếng Anh</span>}
          >
            <Input.TextArea rows={2} className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </Form.Item>

          <Form.Item
            name="source"
            label={<span className="font-bold text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Nguồn gốc trích xuất</span>}
          >
            <Input placeholder="Ví dụ: Lấy từ Video Node.js Full Course" className="h-11 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </Form.Item>

          <Form.Item
            name="tags"
            label={<span className="font-bold text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">Nhãn (ngăn cách bởi dấu phẩy)</span>}
          >
            <Input placeholder="Ví dụ: tech, software, ielts" className="h-11 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </Form.Item>
        </Form>
      ) : (
        <div className="space-y-6">
          <div>
            <Text className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider block mb-1">
              Nghĩa Tiếng Việt
            </Text>
            <Paragraph className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {vocab.meaningVi}
            </Paragraph>
          </div>

          {vocab.meaningEn && (
            <div>
              <Text className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider block mb-1">
                Giải Thích Tiếng Anh
              </Text>
              <Paragraph className="text-slate-600 dark:text-slate-300">
                {vocab.meaningEn}
              </Paragraph>
            </div>
          )}

          {/* Hiển thị mảng ví dụ cấu trúc cao cấp */}
          {vocab.examples?.length > 0 && (
            <div>
              <Text className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider block mb-2">
                Ví dụ minh họa
              </Text>
              <ul className="space-y-3 pl-0 list-none mb-0">
                {vocab.examples.map((item: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-l-4 border-[#7c4dff] pl-3 py-1 bg-slate-50 dark:bg-slate-800/20 rounded-r-xl">
                    <Button
                      type="text"
                      shape="circle"
                      size="small"
                      icon={<SoundOutlined className="text-gray-400 hover:text-[#7c4dff] text-xs" />}
                      onClick={() => handleVoicePlay("en-US", item.sentence.replace(/[\[\]]/g, ""))}
                      className="flex items-center justify-center mt-0.5"
                    />
                    <div>
                      <span dangerouslySetInnerHTML={{ __html: formatSentence(item.sentence) }} />
                      <div className="text-xs text-gray-400 dark:text-slate-500 font-semibold mt-0.5">
                        Dịch: {item.translation}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {vocab.synonyms?.length > 0 && (
            <div>
              <Text className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider block mb-2">
                Từ Đồng Nghĩa
              </Text>
              <Space size="small" className="flex-wrap">
                {vocab.synonyms.map((syn: string) => (
                  <span
                    key={syn}
                    className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full border border-gray-200/40 dark:border-slate-700/50"
                  >
                    {syn}
                  </span>
                ))}
              </Space>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 dark:border-slate-800/40 grid grid-cols-2 gap-4">
            <div>
              <Text className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider block mb-1.5">
                Chủ Đề (Category)
              </Text>
              <span className="text-sm font-bold text-[#7c4dff] uppercase tracking-wide">
                {vocab.category || "General"}
              </span>
            </div>

            {vocab.source && (
              <div>
                <Text className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider block mb-1.5">
                  Nguồn Trích Xuất
                </Text>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                  <BookOutlined />
                  {vocab.source}
                </span>
              </div>
            )}
          </div>

          {vocab.tags?.length > 0 && (
            <div>
              <Text className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider block mb-2">
                Nhãn Ghi Chú (Tags)
              </Text>
              <Space size="small" className="flex-wrap">
                {vocab.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-xs font-semibold bg-purple-50 dark:bg-purple-950/20 text-[#7c4dff] dark:text-purple-300 px-3 py-1 rounded-md flex items-center gap-1 border border-purple-100/40 dark:border-purple-900/30"
                  >
                    <TagOutlined className="text-[10px]" />
                    {tag}
                  </span>
                ))}
              </Space>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};

export default VocabDetailDrawer;
