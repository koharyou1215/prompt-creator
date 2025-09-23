"use client";

import { useState, useEffect, useRef } from "react";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Sparkles, Languages } from "lucide-react";

interface PromptEditorProps {
  prompt: any;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function PromptEditor({
  prompt,
  onChange,
  placeholder = "プロンプトを入力してください...",
  className = "",
}: PromptEditorProps) {
  // LocalStorage for persistent editing
  const storageKey = prompt?.id
    ? `prompt_editor_${prompt.id}`
    : "prompt_editor_temp";
  const translationKey = prompt?.id
    ? `prompt_translation_${prompt.id}`
    : "prompt_translation_temp";

  // Load saved content from localStorage
  const [savedContent, setSavedContent, removeSavedContent] = useLocalStorage(
    storageKey,
    prompt?.content || "",
    {
      debounce: 1000,
      syncAcrossTabs: true,
    }
  );

  const [savedTranslation, setSavedTranslation, removeSavedTranslation] =
    useLocalStorage(translationKey, null as string | null, {
      debounce: 1000,
      syncAcrossTabs: true,
    });

  const [content, setContent] = useState(savedContent || prompt?.content || "");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationPreview, setTranslationPreview] = useState<string | null>(
    null
  );
  const [showTranslationDialog, setShowTranslationDialog] = useState(false);
  const [originalContent, setOriginalContent] = useState<string>("");
  const [translatedContent, setTranslatedContent] = useState<string | null>(
    savedTranslation
  );
  const [showTranslation, setShowTranslation] = useState(true);
  const [originalLanguage, setOriginalLanguage] = useState<"ja" | "en">("en");
  const [isApplyingTranslation, setIsApplyingTranslation] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize content when prompt changes
  useEffect(() => {
    if (prompt?.id) {
      // Load saved content for this prompt
      const saved = savedContent || prompt.content;
      if (saved !== undefined) {
        setContent(saved);
        updateCounts(saved);
      }

      // Load saved translation
      if (savedTranslation) {
        setTranslatedContent(savedTranslation);
      }
    } else if (prompt?.content !== undefined) {
      setContent(prompt.content);
      updateCounts(prompt.content);
    }
  }, [prompt?.id, prompt?.content]);

  // Debounced onChange handler
  const debouncedOnChange = useDebouncedCallback((value: string) => {
    onChange?.(value);
  }, 500);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    updateCounts(newValue);
    setSavedContent(newValue); // Save to localStorage
    debouncedOnChange(newValue);
  };

  const updateCounts = (text?: string | null) => {
    const safeText = typeof text === "string" ? text : "";
    setCharCount(safeText.length);
    const words =
      safeText.trim().length > 0
        ? safeText
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0)
        : [];
    setWordCount(words.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle tab key for indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newContent =
        content.substring(0, start) + "  " + content.substring(end);
      setContent(newContent);

      // Set cursor position after tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const insertText = (text: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newContent =
      content.substring(0, start) + text + content.substring(end);

    setContent(newContent);
    updateCounts(newContent);
    debouncedOnChange(newContent);

    // Set cursor position after inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = start + text.length;
        textareaRef.current.selectionStart = newPosition;
        textareaRef.current.selectionEnd = newPosition;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleOptimize = async () => {
    if (!content || isOptimizing) return;

    setIsOptimizing(true);
    try {
      const apiKey = localStorage.getItem("openRouterApiKey");
      const modelId =
        localStorage.getItem("modelOptimize") || "anthropic/claude-sonnet-4";

      const response = await fetch("/api/prompts/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey && { "x-openrouter-api-key": apiKey }),
        },
        body: JSON.stringify({ prompt: content, modelId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Support both { optimized } and { data: { optimized } } shapes
        const optimized =
          (data && (data.optimized || (data.data && data.data.optimized))) ||
          "";

        if (!optimized) {
          console.error("Optimization returned empty result:", data);
          alert("最適化は成功しましたが、結果が取得できませんでした");
        } else {
          setContent(optimized);
          updateCounts(optimized);
          setSavedContent(optimized); // Save optimized content
          debouncedOnChange(optimized);
        }
      } else {
        const error = await response.json().catch(() => ({}));
        console.error("Optimization failed:", error);
        alert("最適化に失敗しました: " + (error.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Optimization error:", error);
      alert("最適化中にエラーが発生しました");
    } finally {
      setIsOptimizing(false);
    }
  };

  const detectLanguage = (text: string): "ja" | "en" => {
    // Simple language detection based on character types
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    const hasJapanese = japaneseRegex.test(text);
    return hasJapanese ? "ja" : "en";
  };

  const handleTranslate = async () => {
    if (!content || isTranslating) return;

    setIsTranslating(true);
    try {
      const apiKey =
        localStorage.getItem("openRouterApiKey") ||
        localStorage.getItem("geminiApiKey");
      const modelId =
        localStorage.getItem("modelTranslate") || "google/gemini-2.5-flash";

      // Auto-detect source language and set target accordingly
      const sourceLanguage = detectLanguage(content);
      const targetLanguage = sourceLanguage === "ja" ? "en" : "ja";

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey && { "x-openrouter-api-key": apiKey }),
        },
        body: JSON.stringify({
          text: content,
          sourceLang: sourceLanguage,
          targetLang: targetLanguage,
          modelId,
          useCustomDict: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const translated =
          (data && (data.translated || (data.data && data.data.translated))) ||
          "";

        if (!translated) {
          console.error("Translation returned empty result:", data);
          alert("翻訳は成功しましたが、結果が取得できませんでした");
        } else {
          // Store original for undo capability
          setOriginalContent(content);
          setOriginalLanguage(sourceLanguage); // Remember original language
          // Set translated content to show alongside original
          setTranslatedContent(translated);
          setSavedTranslation(translated); // Save to localStorage
          setShowTranslation(true);
        }
      } else {
        const error = await response.json().catch(() => ({}));
        console.error("Translation failed:", error);
        alert("翻訳に失敗しました: " + (error.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Translation error:", error);
      alert("翻訳中にエラーが発生しました");
    } finally {
      setIsTranslating(false);
    }
  };

  const applyTranslation = async () => {
    if (!translationPreview || isApplyingTranslation) return;

    setIsApplyingTranslation(true);
    try {
      // Detect language of edited translation
      const editedLanguage = detectLanguage(translationPreview);

      // If edited text is same language as original, apply directly
      if (editedLanguage === originalLanguage) {
        setContent(translationPreview);
        updateCounts(translationPreview);
        debouncedOnChange(translationPreview);
      } else {
        // Need to translate back to original language
        const apiKey =
          localStorage.getItem("openRouterApiKey") ||
          localStorage.getItem("geminiApiKey");
        const modelId =
          localStorage.getItem("modelTranslate") || "google/gemini-2.5-flash";

        const response = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey && { "x-openrouter-api-key": apiKey }),
          },
          body: JSON.stringify({
            text: translationPreview,
            sourceLang: detectLanguage(translationPreview),
            targetLang: originalLanguage, // Translate back to original language
            modelId,
            useCustomDict: true,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setContent(data.translated);
          updateCounts(data.translated);
          debouncedOnChange(data.translated);
        } else {
          const error = await response.json();
          alert("逆翻訳に失敗しました: " + (error.error || "Unknown error"));
          return;
        }
      }

      setShowTranslationDialog(false);
      setTranslationPreview(null);
    } catch (error) {
      console.error("Apply translation error:", error);
      alert("適用中にエラーが発生しました");
    } finally {
      setIsApplyingTranslation(false);
    }
  };

  const cancelTranslation = () => {
    setShowTranslationDialog(false);
    setTranslationPreview(null);
  };

  const undoTranslation = () => {
    if (originalContent) {
      setContent(originalContent);
      updateCounts(originalContent);
      debouncedOnChange(originalContent);
      setOriginalContent("");
    }
  };

  const handleCursorChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => insertText("[subject]")}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
            主題
          </button>
          <button
            onClick={() => insertText("[style]")}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200">
            スタイル
          </button>
          <button
            onClick={() => insertText("[quality]")}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">
            品質
          </button>
          <button
            onClick={() => insertText("[lighting]")}
            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">
            照明
          </button>
          <button
            onClick={() => insertText("[composition]")}
            className="px-2 py-1 text-xs bg-pink-100 text-pink-700 rounded hover:bg-pink-200">
            構図
          </button>

          <div className="border-l mx-2" />

          <button
            onClick={handleOptimize}
            disabled={isOptimizing || !content}
            className="px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
            {isOptimizing ? (
              <>
                <svg
                  className="animate-spin h-3 w-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                最適化中...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                最適化
              </>
            )}
          </button>

          <button
            onClick={handleTranslate}
            disabled={isTranslating || !content}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
            {isTranslating ? (
              <>
                <svg
                  className="animate-spin h-3 w-3 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                翻訳中...
              </>
            ) : (
              <>
                <Languages className="w-3 h-3" />
                {detectLanguage(content) === "ja" ? "英訳" : "和訳"}
              </>
            )}
          </button>

          {translatedContent && (
            <>
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1">
                {showTranslation ? "翻訳を隠す" : "翻訳を表示"}
              </button>
              <button
                onClick={() => {
                  setTranslatedContent(null);
                  setSavedTranslation(null);
                  removeSavedTranslation();
                  setShowTranslation(true);
                }}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1">
                翻訳をクリア
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>文字数: {charCount}</span>
          <span>単語数: {wordCount}</span>
          <span>カーソル: {cursorPosition}</span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex gap-4 p-4">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={handleCursorChange}
            onKeyUp={handleCursorChange}
            onClick={handleCursorChange}
            placeholder={placeholder}
            className="w-full h-full p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            style={{ minHeight: "400px" }}
          />
        </div>

        {/* Translation Panel */}
        {translatedContent && showTranslation && (
          <div className="flex-1">
            <div className="h-full border rounded-lg bg-blue-50">
              <div className="p-2 bg-blue-100 border-b rounded-t-lg">
                <span className="text-xs font-medium text-blue-700">
                  翻訳結果 (
                  {detectLanguage(translatedContent) === "ja"
                    ? "日本語"
                    : "English"}
                  )
                </span>
              </div>
              <textarea
                value={translatedContent}
                onChange={(e) => {
                  setTranslatedContent(e.target.value);
                  setSavedTranslation(e.target.value);
                }}
                className="w-full h-[calc(100%-32px)] p-4 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="翻訳結果が表示されます..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t px-4 py-2 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>UTF-8</span>
            <span>改行: LF</span>
          </div>
          <div className="flex items-center gap-4">
            {prompt?.updatedAt && (
              <span>
                最終更新: {new Date(prompt.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Translation Preview Dialog */}
      {showTranslationDialog && translationPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-4">翻訳結果のプレビュー</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  元のテキスト:
                </label>
                <div className="p-3 bg-gray-50 rounded border text-sm">
                  {content}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  翻訳結果:
                </label>
                <textarea
                  value={translationPreview}
                  onChange={(e) => setTranslationPreview(e.target.value)}
                  className="w-full p-3 border rounded text-sm"
                  rows={6}
                  placeholder="翻訳結果を編集できます..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={cancelTranslation}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                キャンセル
              </button>
              <button
                onClick={applyTranslation}
                disabled={isApplyingTranslation}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
                {isApplyingTranslation ? "適用中..." : "適用"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
