"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PromptElement } from "@/types/prompt";
import { Button } from "@/components/ui/button";
import { translatorService } from "@/lib/ai/translator";

// デバウンス関数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
import { Languages, Edit2, Sparkles, Lock } from "lucide-react";

interface ElementCardProps {
  element: PromptElement;
  onUpdate: (content: string) => void;
}

const ELEMENT_TYPE_ICONS: Record<string, string> = {
  subject: "👤",
  background: "🏞️",
  style: "🎨",
  lighting: "💡",
  composition: "📐",
  color: "🎨",
  mood: "😊",
  quality: "✨",
  custom: "📝",
};

const ELEMENT_TYPE_LABELS: Record<string, string> = {
  subject: "主題",
  background: "背景",
  style: "スタイル",
  lighting: "照明",
  composition: "構図",
  color: "色彩",
  mood: "雰囲気",
  quality: "品質",
  custom: "カスタム",
};

export function ElementCard({ element, onUpdate }: ElementCardProps) {
  const [editValue, setEditValue] = useState(element.content);
  const [translatedText, setTranslatedText] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isEditingTranslation, setIsEditingTranslation] = useState(false);
  const [editTranslationValue, setEditTranslationValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const translationTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 自動保存機能
  const debouncedUpdate = useCallback(
    debounce((value: string) => {
      if (value.trim() !== element.content) {
        onUpdate(value.trim());
      }
    }, 500),
    [element.content, onUpdate]
  );

  // element.contentが変更されたときにeditValueを同期し、翻訳結果をリセット
  useEffect(() => {
    if (editValue !== element.content) {
      setEditValue(element.content);
      // 翻訳結果をリセット
      setTranslatedText("");
      setEditTranslationValue("");
      setShowTranslation(false);
      setIsEditingTranslation(false);
    }
  }, [element.content]);

  // 編集中の変更を監視して自動保存（ちらつき防止）
  const lastSavedValue = useRef<string>(element.content);

  useEffect(() => {
    if (editValue !== element.content && editValue !== lastSavedValue.current) {
      debouncedUpdate(editValue);
      lastSavedValue.current = editValue;
    }
  }, [editValue, debouncedUpdate, element.content]);

  // 翻訳結果の編集時の処理（元のテキストを上書きしない）
  const handleTranslationEdit = useCallback((value: string) => {
    setEditTranslationValue(value);
  }, []);

  // 翻訳結果の適用（編集した翻訳結果を逆翻訳してから適用）
  const applyTranslation = useCallback(async () => {
    if (editTranslationValue && editTranslationValue !== "翻訳に失敗しました") {
      try {
        // 編集した翻訳結果を逆翻訳
        const { TranslatorService } = await import("@/lib/ai/translator");
        const freshTranslator = new TranslatorService();

        // 現在の翻訳の言語を検出（通常は英語のはず）
        const currentLang = await freshTranslator.detectLanguage(editTranslationValue);

        // 逆翻訳（英語→日本語、または日本語→英語）
        const reverseLang = currentLang === "ja" ? "en" : "ja";

        const reverseTranslated = await freshTranslator.translate(
          editTranslationValue,
          currentLang,
          reverseLang,
          true
        );

        // 逆翻訳した結果を適用
        setEditValue(reverseTranslated);
        onUpdate(reverseTranslated);
        setShowTranslation(false);
        setIsEditingTranslation(false);
      } catch (error) {
        console.error("逆翻訳エラー:", error);
        // エラーの場合は編集した内容をそのまま適用
        setEditValue(editTranslationValue);
        onUpdate(editTranslationValue);
        setShowTranslation(false);
        setIsEditingTranslation(false);
      }
    }
  }, [editTranslationValue, onUpdate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(element.content);
  };

  const handleTranslate = async () => {
    if (!element.content.trim()) return;

    setIsTranslating(true);
    // 翻訳開始前に既存の翻訳結果をクリア
    setTranslatedText("");
    setEditTranslationValue("");
    setShowTranslation(false);
    setIsEditingTranslation(false);

    try {
      // 設定画面で保存したAPIキーとモデル設定を反映するため、新しいインスタンスを作成
      const { TranslatorService } = await import("@/lib/ai/translator");
      const freshTranslator = new TranslatorService();

      // 言語を自動検出して、日本語→英語、英語→日本語に翻訳
      const detectedLang = await freshTranslator.detectLanguage(
        element.content
      );

      // 日本語なら英語へ、それ以外（英語含む）なら日本語へ翻訳
      const targetLang = detectedLang === "ja" ? "en" : "ja";
      const sourceLang = detectedLang === "auto" ? "auto" : detectedLang;

      const translation = await freshTranslator.translate(
        element.content,
        sourceLang,
        targetLang,
        true
      );
      setTranslatedText(translation);
      setEditTranslationValue(translation);
      setShowTranslation(true);
    } catch (error) {
      console.error("Translation failed:", error);
      setTranslatedText("翻訳に失敗しました");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleQuickApplyTranslation = () => {
    // 翻訳結果を即座に適用（編集せずに）
    if (translatedText && translatedText !== "翻訳に失敗しました") {
      setEditValue(translatedText);
      onUpdate(translatedText);
      setShowTranslation(false);
      setIsEditingTranslation(false);
    }
  };

  const handleEditTranslation = () => {
    setIsEditingTranslation(true);
    setEditTranslationValue(translatedText);
  };

  const handleSaveTranslation = () => {
    setTranslatedText(editTranslationValue);
    setIsEditingTranslation(false);
  };

  const handleCancelTranslationEdit = () => {
    setEditTranslationValue(translatedText);
    setIsEditingTranslation(false);
  };

  // 自動翻訳機能（現在は無効化）
  // 設定画面で自動翻訳が有効になった場合にここで実装予定
  useEffect(() => {
    // 自動翻訳のロジックは後で実装
    // 現在のバージョンでは手動翻訳のみ対応
  }, [element.content]);

  return (
    <div className="relative group">
      <div className="bg-white border rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{ELEMENT_TYPE_ICONS[element.type]}</span>
          <span className="text-sm font-medium text-gray-600">
            {ELEMENT_TYPE_LABELS[element.type]}
          </span>
          {element.isLocked && <Lock className="h-3 w-3 text-gray-500" />}
        </div>

        <div
          className={`grid gap-4 ${
            showTranslation ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
          }`}>
          {/* メイン編集エリア */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                プロンプト
              </label>
              <div className="text-xs text-gray-500">
                自動保存中... ({editValue.length}文字)
              </div>
            </div>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 min-h-[120px] text-sm"
              rows={5}
              placeholder="プロンプトを入力してください..."
              onFocus={(e) => {
                e.target.select();
              }}
            />
          </div>

          {/* 翻訳結果エリア（翻訳した場合のみ表示） */}
          {showTranslation && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  翻訳結果
                </label>
                <div className="flex gap-1">
                  {!isEditingTranslation && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingTranslation(true)}
                      className="h-6 px-2 text-xs">
                      <Edit2 className="h-3 w-3 mr-1" />
                      編集
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={applyTranslation}
                    className="h-6 px-2 text-xs bg-green-100 hover:bg-green-200">
                    <Sparkles className="h-3 w-3 mr-1" />
                    適用
                  </Button>
                </div>
              </div>

              {isEditingTranslation ? (
                <textarea
                  value={editTranslationValue}
                  onChange={(e) => handleTranslationEdit(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg resize-none text-sm focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                  rows={5}
                  placeholder="翻訳結果を編集してください..."
                  onFocus={(e) => {
                    e.target.select();
                  }}
                />
              ) : (
                <div
                  className="w-full px-3 py-2 border rounded-lg bg-blue-50 text-sm text-blue-800 min-h-[120px] cursor-text hover:bg-blue-100 transition-colors"
                  onClick={() => setIsEditingTranslation(true)}>
                  {translatedText}
                </div>
              )}

              <div className="text-xs text-gray-500">
                文字数:{" "}
                {isEditingTranslation
                  ? editTranslationValue.length
                  : translatedText.length}
              </div>
            </div>
          )}

          {/* 翻訳前のプレビューエリア（翻訳していない場合） */}
          {!showTranslation && (
            <div className="flex items-center justify-center p-3 border rounded-lg bg-gray-50">
              <div className="text-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (element.content.trim()) {
                      handleTranslate();
                    }
                  }}
                  disabled={isTranslating}
                  className="mb-1">
                  {isTranslating ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      翻訳中...
                    </>
                  ) : (
                    <>
                      <Languages className="h-4 w-4 mr-2" />
                      翻訳
                    </>
                  )}
                </Button>
                <div className="text-xs text-gray-500">
                  プロンプトを翻訳して確認できます
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
