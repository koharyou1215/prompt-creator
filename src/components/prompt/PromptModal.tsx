"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Edit2, RotateCcw, MessageCircle, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  panelId: number;
}

interface PromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: any; // Optional prompt data for editing
}

const PANEL_COLORS = [
  { bg: "bg-red-500", text: "text-white" },
  { bg: "bg-blue-500", text: "text-white" },
  { bg: "bg-green-500", text: "text-white" },
  { bg: "bg-purple-500", text: "text-white" },
];

export function PromptModal({ open, onOpenChange, prompt }: PromptModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentPanel, setCurrentPanel] = useState(0);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with prompt content if provided
  useEffect(() => {
    if (prompt && prompt.content) {
      setInputValue(prompt.content);
    }
  }, [prompt]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
      panelId: currentPanel,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // AI応答をシミュレート（実際にはAPI呼び出し）
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `AIからの応答：${inputValue.trim()}に対する処理結果です。この部分は実際のAPI呼び出しに置き換えてください。`,
        isUser: false,
        timestamp: new Date(),
        panelId: currentPanel,
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessage(messageId);
    setEditValue(content);
  };

  const handleSaveEdit = () => {
    if (!editingMessage || !editValue.trim()) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === editingMessage ? { ...msg, content: editValue.trim() } : msg
      )
    );

    setEditingMessage(null);
    setEditValue("");

    // 編集したメッセージを再送信
    const editedMessage = messages.find((m) => m.id === editingMessage);
    if (editedMessage && editedMessage.isUser) {
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: `編集されたプロンプト：${editValue.trim()}に対する新しい応答です。`,
          isUser: false,
          timestamp: new Date(),
          panelId: currentPanel,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }, 1000);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    alert("クリップボードにコピーしました");
  };

  const handleRegenerate = () => {
    // 同じプロンプトを続けて投げるのではなく、新しい状態で投げる
    if (messages.length === 0) return;

    const lastUserMessage = [...messages].reverse().find((m) => m.isUser);
    if (!lastUserMessage) return;

    setMessages((prev) => {
      const newMessages = prev.filter((m) => m.id !== lastUserMessage.id);
      return newMessages;
    });

    // 新しい状態で同じメッセージを再送信
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `再生成された応答：${lastUserMessage.content}に対する新しい結果です。`,
        isUser: false,
        timestamp: new Date(),
        panelId: currentPanel,
      };
      setMessages((prev) => [...prev, lastUserMessage, aiMessage]);
    }, 1000);
  };

  const handleCopyAll = () => {
    const allContent = messages
      .map((m) => `${m.isUser ? "ユーザー" : "AI"}: ${m.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(allContent);
    alert("すべての会話をクリップボードにコピーしました");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden shadow-xl border-2">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              チャットプロンプト
            </DialogTitle>
            <div className="flex gap-2">
              {PANEL_COLORS.map((color, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPanel(index)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    currentPanel === index
                      ? `${color.bg} ${color.text} shadow-md`
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}>
                  パネル {index + 1}
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* チャットメッセージエリア */}
        <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-gray-50 max-h-[60vh]">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                メッセージがありません。プロンプトを入力して開始してください。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start gap-3">
                  {message.isUser ? (
                    // ユーザー吹き出し
                    <div className="flex-1 flex justify-end">
                      <div className="max-w-[70%]">
                        {editingMessage === message.id ? (
                          <div
                            className={`${PANEL_COLORS[message.panelId].bg} ${
                              PANEL_COLORS[message.panelId].text
                            } rounded-lg p-3 shadow-md`}>
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className={`w-full bg-transparent ${
                                PANEL_COLORS[message.panelId].text
                              } placeholder-gray-200 resize-none`}
                              rows={3}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit();
                                }
                                if (e.key === "Escape") {
                                  setEditingMessage(null);
                                  setEditValue("");
                                }
                              }}
                            />
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={handleSaveEdit}
                                className="text-xs">
                                保存
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingMessage(null);
                                  setEditValue("");
                                }}
                                className="text-xs">
                                キャンセル
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`${PANEL_COLORS[message.panelId].bg} ${
                              PANEL_COLORS[message.panelId].text
                            } rounded-lg p-3 shadow-md relative group`}>
                            <p className="whitespace-pre-wrap">
                              {message.content}
                            </p>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleCopyMessage(message.content)
                                }
                                className={`h-6 w-6 p-0 ${
                                  PANEL_COLORS[message.panelId].text
                                } hover:opacity-80`}>
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleEditMessage(message.id, message.content)
                                }
                                className={`h-6 w-6 p-0 ${
                                  PANEL_COLORS[message.panelId].text
                                } hover:opacity-80`}>
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // AI応答（吹き出しなし、直書き）
                    <div className="flex-1">
                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap text-gray-800">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 入力エリア */}
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="プロンプトを入力してください..."
              className="flex-1 px-3 py-2 border rounded-md resize-none"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="px-4">
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* コピー・再生成メニュー */}
          {messages.length > 0 && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAll}
                className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                すべてコピー
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                再生成
              </Button>
            </div>
          )}
        </div>

        {/* キャンセルボタン */}
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
