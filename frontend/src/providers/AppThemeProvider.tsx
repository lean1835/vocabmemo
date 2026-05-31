import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { ConfigProvider, theme } from "antd";
import type { RootState } from "../stores/store";

interface AppThemeProviderProps {
  children: React.ReactNode;
}

export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [isDarkMode]);

  // Thiết lập token tùy biến cao cấp cho Ant Design v6 đồng bộ màu sắc
  const customTheme = {
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: "#0056b3", // VocabMemo Blue
      borderRadius: 12,
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      colorBgContainer: isDarkMode ? "#1c1c1e" : "#ffffff",
      colorBgElevated: isDarkMode ? "#2c2c2e" : "#ffffff",
    },
  };

  return (
    <ConfigProvider theme={customTheme}>
      {children}
    </ConfigProvider>
  );
};

export default AppThemeProvider;
