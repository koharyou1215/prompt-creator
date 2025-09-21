'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Layers, RefreshCw } from 'lucide-react';
import { Prompt, PromptElement } from '@/types/prompt';

interface CompareWorkspaceProps {
  leftPrompt: Prompt;
  rightPrompt: Prompt;
  onClose?: () => void;
}

export function CompareWorkspace({
  leftPrompt,
  rightPrompt,
  onClose
}: CompareWorkspaceProps) {
  const [showDifferences, setShowDifferences] = useState(true);
  const [syncScroll, setSyncScroll] = useState(true);
  const [leftElements, setLeftElements] = useState<PromptElement[]>([]);
  const [rightElements, setRightElements] = useState<PromptElement[]>([]);
  const [differences, setDifferences] = useState<any>({
    added: [],
    removed: [],
    modified: []
  });

  useEffect(() => {
    setLeftElements(leftPrompt.elements || []);
    setRightElements(rightPrompt.elements || []);
    analyzeDifferences();
  }, [leftPrompt, rightPrompt]);

  const analyzeDifferences = () => {
    const leftMap = new Map((leftPrompt.elements || []).map(el => [el.id, el]));
    const rightMap = new Map((rightPrompt.elements || []).map(el => [el.id, el]));

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];

    // Find added and modified elements
    rightPrompt.elements?.forEach(el => {
      if (!leftMap.has(el.id)) {
        added.push(el.id);
      } else {
        const leftEl = leftMap.get(el.id)!;
        if (el.content !== leftEl.content || el.type !== leftEl.type) {
          modified.push(el.id);
        }
      }
    });

    // Find removed elements
    leftPrompt.elements?.forEach(el => {
      if (!rightMap.has(el.id)) {
        removed.push(el.id);
      }
    });

    setDifferences({ added, removed, modified });
  };

  const getDiffClass = (elementId: string, side: 'left' | 'right') => {
    if (!showDifferences) return '';

    if (differences.added.includes(elementId) && side === 'right') {
      return 'bg-green-50 border-green-300';
    }
    if (differences.removed.includes(elementId) && side === 'left') {
      return 'bg-red-50 border-red-300';
    }
    if (differences.modified.includes(elementId)) {
      return 'bg-yellow-50 border-yellow-300';
    }
    return '';
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>, side: 'left' | 'right') => {
    if (!syncScroll) return;

    const source = e.currentTarget;
    const target = document.getElementById(side === 'left' ? 'right-panel' : 'left-panel');

    if (target) {
      target.scrollTop = source.scrollTop;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">プロンプト比較</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDifferences(!showDifferences)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  showDifferences
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Layers className="w-4 h-4 inline mr-1" />
                差分表示
              </button>
              <button
                onClick={() => setSyncScroll(!syncScroll)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  syncScroll
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                同期スクロール
              </button>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Comparison Stats */}
        {showDifferences && (
          <div className="px-6 py-3 bg-gray-50 border-b flex items-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-400 rounded"></span>
              追加: {differences.added.length}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-400 rounded"></span>
              削除: {differences.removed.length}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-400 rounded"></span>
              変更: {differences.modified.length}
            </span>
          </div>
        )}

        {/* Compare Panels */}
        <div className="flex-1 flex">
          {/* Left Panel */}
          <div className="flex-1 border-r">
            <div className="px-4 py-2 bg-gray-100 font-medium text-sm">
              {leftPrompt.title || 'バージョン 1'}
            </div>
            <div
              id="left-panel"
              className="h-full overflow-y-auto p-4"
              onScroll={(e) => handleScroll(e, 'left')}
            >
              <div className="space-y-3">
                {leftElements.map((element) => (
                  <div
                    key={element.id}
                    className={`p-4 border rounded-lg ${getDiffClass(element.id, 'left')}`}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {element.type}
                    </div>
                    <div className="text-sm">{element.content}</div>
                    {element.variations && element.variations.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {element.variations.length} バリエーション
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1">
            <div className="px-4 py-2 bg-gray-100 font-medium text-sm">
              {rightPrompt.title || 'バージョン 2'}
            </div>
            <div
              id="right-panel"
              className="h-full overflow-y-auto p-4"
              onScroll={(e) => handleScroll(e, 'right')}
            >
              <div className="space-y-3">
                {rightElements.map((element) => (
                  <div
                    key={element.id}
                    className={`p-4 border rounded-lg ${getDiffClass(element.id, 'right')}`}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {element.type}
                    </div>
                    <div className="text-sm">{element.content}</div>
                    {element.variations && element.variations.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {element.variations.length} バリエーション
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t px-6 py-4 flex justify-between">
          <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            左を採用
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            マージして保存
          </button>
          <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2">
            右を採用
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}