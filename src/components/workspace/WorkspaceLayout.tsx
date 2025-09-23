"use client";

import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Settings,
  History,
  FileText,
  Layers,
} from "lucide-react";

interface WorkspaceLayoutProps {
  leftPanel?: ReactNode;
  centerPanel: ReactNode;
  rightPanel?: ReactNode;
  children?: ReactNode;
  activeMode?: "edit" | "compare" | "history";
  onModeChange?: (mode: "edit" | "compare" | "history") => void;
  onOpenSettings?: () => void;
}

export function WorkspaceLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  children,
  activeMode = "edit",
  onModeChange,
  onOpenSettings,
}: WorkspaceLayoutProps) {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* モバイルメニュートグル */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden">
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* ロゴ/タイトル */}
          <h1 className="text-xl font-semibold">Prompt Creator</h1>

          {/* モード切り替えタブ */}
          <div className="hidden lg:flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={activeMode === "edit" ? "default" : "ghost"}
              size="sm"
              onClick={() => onModeChange?.("edit")}
              className="rounded-md">
              <Layers className="h-4 w-4 mr-2" />
              編集
            </Button>
            <Button
              variant={activeMode === "compare" ? "default" : "ghost"}
              size="sm"
              onClick={() => onModeChange?.("compare")}
              className="rounded-md">
              <FileText className="h-4 w-4 mr-2" />
              比較
            </Button>
            <Button
              variant={activeMode === "history" ? "default" : "ghost"}
              size="sm"
              onClick={() => onModeChange?.("history")}
              className="rounded-md">
              <History className="h-4 w-4 mr-2" />
              履歴
            </Button>
          </div>
        </div>

        {/* ヘッダー右側 */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="open-settings"
            onClick={() => {
              // debug log to verify handler runs in the browser console
              // (will be removed later)
              console.log("workspace: settings clicked");
              onOpenSettings?.();
            }}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左パネル */}
        <div
          className={cn(
            "bg-white border-r transition-all duration-300",
            leftPanelCollapsed ? "w-0" : "w-[250px]",
            "hidden lg:block"
          )}>
          {!leftPanelCollapsed && (
            <div className="h-full flex flex-col">
              {/* パネルヘッダー */}
              <div className="p-3 border-b flex items-center justify-between">
                <h2 className="font-medium text-sm">構造</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLeftPanelCollapsed(true)}
                  className="h-6 w-6">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              {/* パネルコンテンツ */}
              <div className="flex-1 overflow-y-auto p-3">{leftPanel}</div>
            </div>
          )}
        </div>

        {/* 左パネル展開ボタン */}
        {leftPanelCollapsed && (
          <div className="hidden lg:flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeftPanelCollapsed(false)}
              className="h-full rounded-none hover:bg-gray-100">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* 中央パネル */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="h-full">{centerPanel}</div>
          </div>
        </div>

        {/* 右パネル展開ボタン */}
        {rightPanelCollapsed && (
          <div className="hidden lg:flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightPanelCollapsed(false)}
              className="h-full rounded-none hover:bg-gray-100">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* 右パネル */}
        <div
          className={cn(
            "bg-white border-l transition-all duration-300",
            rightPanelCollapsed ? "w-0" : "w-[350px]",
            "hidden lg:block"
          )}>
          {!rightPanelCollapsed && (
            <div className="h-full flex flex-col">
              {/* パネルヘッダー */}
              <div className="p-3 border-b flex items-center justify-between">
                <h2 className="font-medium text-sm">プレビュー & AI</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightPanelCollapsed(true)}
                  className="h-6 w-6">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {/* パネルコンテンツ */}
              <div className="flex-1 overflow-y-auto p-3">{rightPanel}</div>
            </div>
          )}
        </div>
      </div>

      {/* モバイルメニュー */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">メニュー</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* モバイル用モード切り替え */}
            <div className="space-y-2">
              <Button
                variant={activeMode === "edit" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  onModeChange?.("edit");
                  setMobileMenuOpen(false);
                }}>
                <Layers className="h-4 w-4 mr-2" />
                編集モード
              </Button>
              <Button
                variant={activeMode === "compare" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  onModeChange?.("compare");
                  setMobileMenuOpen(false);
                }}>
                <FileText className="h-4 w-4 mr-2" />
                比較モード
              </Button>
              <Button
                variant={activeMode === "history" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  onModeChange?.("history");
                  setMobileMenuOpen(false);
                }}>
                <History className="h-4 w-4 mr-2" />
                履歴モード
              </Button>
            </div>

            {/* モバイル用パネルコンテンツ */}
            <div className="mt-6 space-y-4">
              {leftPanel && (
                <div>
                  <h3 className="font-medium mb-2">構造</h3>
                  <div className="border rounded-lg p-3">{leftPanel}</div>
                </div>
              )}
              {rightPanel && (
                <div>
                  <h3 className="font-medium mb-2">プレビュー & AI</h3>
                  <div className="border rounded-lg p-3">{rightPanel}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
