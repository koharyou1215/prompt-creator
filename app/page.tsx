"use client";
import React, { useState } from "react";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { PromptModal } from "@/components/prompt/PromptModal";
import { Button } from "@/components/ui/button";
import { Settings, Plus } from "lucide-react";

interface PromptModalState {
  id: string;
  open: boolean;
  prompt: any | null;
}

export default function HomePage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [promptModals, setPromptModals] = useState<PromptModalState[]>([
    { id: "default", open: true, prompt: null }, // デフォルトで1つのモーダルを開く
  ]);

  const handleNewPrompt = () => {
    const newId = `modal-${Date.now()}`;
    setPromptModals((prev) => [
      ...prev,
      { id: newId, open: true, prompt: null },
    ]);
  };

  const handleModalClose = (modalId: string) => {
    setPromptModals((prev) => prev.filter((modal) => modal.id !== modalId));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            チャットプロンプトクリエイター
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              設定
            </Button>
            <Button size="sm" onClick={handleNewPrompt}>
              <Plus className="h-4 w-4 mr-2" />
              チャット開始
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              チャットプロンプトクリエイター
            </h2>
            <p className="text-gray-600">
              パネルごとに色分けされたチャットUIでプロンプトを作成・編集できます
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">パネル機能</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    name: "パネル1",
                    color: "bg-red-500",
                    description: "赤色のパネル",
                  },
                  {
                    name: "パネル2",
                    color: "bg-blue-500",
                    description: "青色のパネル",
                  },
                  {
                    name: "パネル3",
                    color: "bg-green-500",
                    description: "緑色のパネル",
                  },
                  {
                    name: "パネル4",
                    color: "bg-purple-500",
                    description: "紫色のパネル",
                  },
                ].map((panel, index) => (
                  <div
                    key={index}
                    className="text-center p-4 border rounded-lg">
                    <div
                      className={`w-8 h-8 ${panel.color} rounded-full mx-auto mb-2`}></div>
                    <div className="font-medium">{panel.name}</div>
                    <div className="text-sm text-gray-500">
                      {panel.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <Button onClick={handleNewPrompt} className="px-8 py-3 text-lg">
                <Plus className="h-5 w-5 mr-2" />
                チャットを開始する
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Multiple Prompt Modals */}
      {promptModals.map((modal, index) => (
        <div
          key={modal.id}
          style={{
            position: "fixed",
            zIndex: 1000 + index,
            left: `${20 + index * 50}px`,
            top: `${20 + index * 50}px`,
          }}>
          <PromptModal
            open={modal.open}
            onOpenChange={(open) => {
              if (!open) {
                handleModalClose(modal.id);
              }
            }}
            prompt={modal.prompt}
          />
        </div>
      ))}
    </div>
  );
}
