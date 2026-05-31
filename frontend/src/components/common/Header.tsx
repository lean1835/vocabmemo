import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { Button, Dropdown, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import { SunOutlined, MoonOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import type { RootState } from "../../stores/store";
import { toggleTheme } from "../../stores/themeSlice";
import { useGetMeQuery } from "../../modules/auth/services/authApi";

const { Text } = Typography;

export const Header: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  
  // Lấy thông tin user hiện tại nếu có token
  const token = localStorage.getItem("token");
  const { data: meData } = useGetMeQuery(undefined, { skip: !token });
  const username = meData?.data?.username || "Học viên";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
    window.location.reload();
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "username",
      label: <span className="font-semibold text-[#dca11e]">{username}</span>,
      disabled: true,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined className="text-red-500" />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-gray-200/50 dark:border-slate-800/60 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <span className="text-xl">💛</span>
          <span className="text-lg font-black text-[#dca11e] tracking-tight">
            LexiNote
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Toggle Dark Mode */}
        <Button
          type="text"
          shape="circle"
          size="large"
          icon={isDarkMode ? <SunOutlined className="text-yellow-400" /> : <MoonOutlined className="text-[#dca11e]" />}
          onClick={() => dispatch(toggleTheme())}
          className="flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800/50"
        />

        {token ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
            <Button
              type="primary"
              shape="round"
              className="bg-[#dca11e] hover:bg-[#c99015] border-none flex items-center gap-2 shadow-sm font-semibold"
            >
              <UserOutlined />
              <span>{username}</span>
            </Button>
          </Dropdown>
        ) : (
          <Space>
            <Button type="text" onClick={() => navigate("/login")} className="dark:text-gray-300 font-semibold">
              Đăng nhập
            </Button>
            <Button
              type="primary"
              className="bg-[#dca11e] hover:bg-[#c99015] border-none rounded-xl font-semibold shadow-sm"
              onClick={() => navigate("/register")}
            >
              Đăng ký
            </Button>
          </Space>
        )}
      </div>
    </header>
  );
};

export default Header;
