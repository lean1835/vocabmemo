import React from "react";
import { Card, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

interface FilterCardProps {
  children: React.ReactNode;
  onRefresh: () => void;
  loading?: boolean;
}

export const FilterItem: React.FC<{ label: string; children: React.ReactNode; width?: string | number }> = ({
  label,
  children,
  width,
}) => (
  <div style={{ width: width || "auto", minWidth: "180px" }} className="flex-1">
    <div className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 mb-1.5 tracking-wider ml-1">
      {label}
    </div>
    {children}
  </div>
);

const FilterCard: React.FC<FilterCardProps> = ({ children, onRefresh, loading }) => (
  <Card
    className="mb-6 rounded-2xl border-none shadow-md shadow-gray-200/30 dark:shadow-none bg-white dark:bg-slate-800"
    styles={{ body: { padding: "20px 24px" } }}
  >
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex-1 flex flex-wrap items-end gap-4">{children}</div>
      <div>
        <Button
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          loading={loading}
          className="h-10 px-5 rounded-xl flex items-center gap-2 font-bold text-orange-500 border-orange-200 bg-orange-50/20 hover:bg-orange-50 dark:hover:bg-slate-700 hover:border-orange-300 dark:border-slate-700 transition-all"
        >
          Làm mới
        </Button>
      </div>
    </div>
  </Card>
);

export default FilterCard;
