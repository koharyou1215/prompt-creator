'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebouncedCallback } from '@/hooks/useDebounce';

interface PromptEditorProps {
  prompt: any;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function PromptEditor({
  prompt,
  onChange,
  placeholder = 'プロンプトを入力してください...',
  className = ''
}: PromptEditorProps) {
  const [content, setContent] = useState(prompt?.content || '');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize content when prompt changes
  useEffect(() => {
    if (prompt?.content !== undefined) {
      setContent(prompt.content);
      updateCounts(prompt.content);
    }
  }, [prompt?.content]);

  // Debounced onChange handler
  const debouncedOnChange = useDebouncedCallback((value: string) => {
    onChange?.(value);
  }, 500);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    updateCounts(newValue);
    debouncedOnChange(newValue);
  };

  const updateCounts = (text: string) => {
    setCharCount(text.length);
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
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
    const newContent = content.substring(0, start) + text + content.substring(end);

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
            onClick={() => insertText('[subject]')}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            主題
          </button>
          <button
            onClick={() => insertText('[style]')}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
          >
            スタイル
          </button>
          <button
            onClick={() => insertText('[quality]')}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            品質
          </button>
          <button
            onClick={() => insertText('[lighting]')}
            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
          >
            照明
          </button>
          <button
            onClick={() => insertText('[composition]')}
            className="px-2 py-1 text-xs bg-pink-100 text-pink-700 rounded hover:bg-pink-200"
          >
            構図
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>文字数: {charCount}</span>
          <span>単語数: {wordCount}</span>
          <span>カーソル: {cursorPosition}</span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4">
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
          style={{ minHeight: '400px' }}
        />
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
              <span>最終更新: {new Date(prompt.updatedAt).toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}