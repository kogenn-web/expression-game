
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "表达式简化小游戏",
  description: "点击变换规则，体验 AI 与人类简化路径差异",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
