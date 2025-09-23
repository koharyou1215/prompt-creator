"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Layers,
  RefreshCw,
  Grid,
  LayoutGrid,
  Minimize2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Prompt, PromptElement } from "@/types/prompt";

interface CompareItem {
  id: string;
  prompt: Prompt;
  image?: string;
  version?: number;
}

interface MultiCompareWorkspaceProps {
  items: CompareItem[];
  onClose?: () => void;
  onItemRemove?: (id: string) => void;
  onItemAdd?: () => void;
}

type LayoutMode = "grid" | "horizontal" | "vertical" | "focus";

export function MultiCompareWorkspace({
  items,
  onClose,
  onItemRemove,
  onItemAdd,
}: MultiCompareWorkspaceProps) {
  const [compareItems, setCompareItems] = useState<CompareItem[]>(
    items.slice(0, 4)
  );
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("grid");
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const [showDifferences, setShowDifferences] = useState(true);
  const [syncScroll, setSyncScroll] = useState(true);
  const [differences, setDifferences] = useState<Map<string, any>>(new Map());
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    setCompareItems(items.slice(0, 4));
    analyzeDifferences();
  }, [items]);

  const analyzeDifferences = () => {
    const diffMap = new Map();

    if (compareItems.length < 2) return;

    const basePrompt = compareItems[0].prompt;
    const baseElements = new Map(
      basePrompt.elements?.map((el) => [el.id, el]) || []
    );

    compareItems.slice(1).forEach((item) => {
      const itemDiff = {
        added: [] as string[],
        removed: [] as string[],
        modified: [] as string[],
      };

      const itemElements = new Map(
        item.prompt.elements?.map((el) => [el.id, el]) || []
      );

      // Find added and modified
      item.prompt.elements?.forEach((el) => {
        if (!baseElements.has(el.id)) {
          itemDiff.added.push(el.id);
        } else {
          const baseEl = baseElements.get(el.id)!;
          if (el.content !== baseEl.content || el.type !== baseEl.type) {
            itemDiff.modified.push(el.id);
          }
        }
      });

      // Find removed
      basePrompt.elements?.forEach((el) => {
        if (!itemElements.has(el.id)) {
          itemDiff.removed.push(el.id);
        }
      });

      diffMap.set(item.id, itemDiff);
    });

    setDifferences(diffMap);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>, sourceId: string) => {
    if (!syncScroll) return;

    const source = e.currentTarget;
    Object.entries(scrollRefs.current).forEach(([id, ref]) => {
      if (id !== sourceId && ref) {
        ref.scrollTop = source.scrollTop;
        ref.scrollLeft = source.scrollLeft;
      }
    });
  };

  const getDiffClass = (
    itemId: string,
    elementId: string,
    isBase: boolean = false
  ) => {
    if (!showDifferences) return "";

    if (isBase) return "";

    const itemDiff = differences.get(itemId);
    if (!itemDiff) return "";

    if (itemDiff.added.includes(elementId)) {
      return "bg-green-50 border-green-300";
    }
    if (itemDiff.removed.includes(elementId)) {
      return "bg-red-50 border-red-300";
    }
    if (itemDiff.modified.includes(elementId)) {
      return "bg-yellow-50 border-yellow-300";
    }
    return "";
  };

  const getLayoutClasses = () => {
    switch (layoutMode) {
      case "grid":
        return compareItems.length <= 2
          ? "grid-cols-2"
          : "grid-cols-2 grid-rows-2";
      case "horizontal":
        return `grid-cols-${Math.min(compareItems.length, 4)}`;
      case "vertical":
        return "grid-cols-1";
      case "focus":
        return "grid-cols-3";
      default:
        return "grid-cols-2";
    }
  };

  const renderComparePanel = (item: CompareItem, index: number) => {
    const isFocused = layoutMode === "focus" && item.id === focusedItem;
    const isHidden =
      layoutMode === "focus" && item.id !== focusedItem && focusedItem !== null;

    if (isHidden) return null;

    return (
      <div
        key={item.id}
        className={`
          border rounded-lg bg-white overflow-hidden flex flex-col
          ${isFocused ? "col-span-2 row-span-2" : ""}
        `}>
        {/* Panel Header */}
        <div className="px-4 py-2 bg-gray-100 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {item.prompt.title || `プロンプト ${index + 1}`}
            </span>
            {item.version && (
              <span className="text-xs text-gray-500">v{item.version}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFocusedItem(isFocused ? null : item.id)}
              className="p-1 hover:bg-gray-200 rounded">
              {isFocused ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            {onItemRemove && compareItems.length > 2 && (
              <button
                onClick={() => onItemRemove(item.id)}
                className="p-1 hover:bg-gray-200 rounded">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Panel Content */}
        <div className="flex-1 flex">
          {/* Image Preview (if available) */}
          {item.image && (
            <div className="w-1/3 border-r p-4 bg-gray-50">
              <img
                src={item.image}
                alt="Preview"
                className="w-full h-auto rounded-lg shadow-sm"
              />
            </div>
          )}

          {/* Prompt Content */}
          <div
            ref={(el) => {
              scrollRefs.current[item.id] = el;
            }}
            className="flex-1 overflow-y-auto p-4"
            onScroll={(e) => handleScroll(e, item.id)}>
            <div className="space-y-3">
              {item.prompt.elements?.map((element) => (
                <div
                  key={element.id}
                  className={`
                    p-3 border rounded-lg transition-colors
                    ${getDiffClass(item.id, element.id, index === 0)}
                  `}>
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

        {/* Panel Stats */}
        {showDifferences && differences.has(item.id) && (
          <div className="px-4 py-2 bg-gray-50 border-t text-xs flex items-center gap-4">
            {differences.get(item.id).added.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded"></span>+
                {differences.get(item.id).added.length}
              </span>
            )}
            {differences.get(item.id).removed.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-400 rounded"></span>-
                {differences.get(item.id).removed.length}
              </span>
            )}
            {differences.get(item.id).modified.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-400 rounded"></span>~
                {differences.get(item.id).modified.length}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-100 rounded-xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              マルチプロンプト比較 ({compareItems.length}/4)
            </h2>

            {/* Layout Mode Selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLayoutMode("grid")}
                className={`px-3 py-1 rounded text-sm ${
                  layoutMode === "grid" ? "bg-white shadow-sm" : "text-gray-600"
                }`}>
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode("horizontal")}
                className={`px-3 py-1 rounded text-sm ${
                  layoutMode === "horizontal"
                    ? "bg-white shadow-sm"
                    : "text-gray-600"
                }`}>
                <LayoutGrid className="w-4 h-4 rotate-90" />
              </button>
              <button
                onClick={() => setLayoutMode("vertical")}
                className={`px-3 py-1 rounded text-sm ${
                  layoutMode === "vertical"
                    ? "bg-white shadow-sm"
                    : "text-gray-600"
                }`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDifferences(!showDifferences)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  showDifferences
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                <Layers className="w-4 h-4 inline mr-1" />
                差分表示
              </button>
              <button
                onClick={() => setSyncScroll(!syncScroll)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  syncScroll
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                <RefreshCw className="w-4 h-4 inline mr-1" />
                同期スクロール
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onItemAdd && compareItems.length < 4 && (
              <button
                onClick={onItemAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                プロンプト追加
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Compare Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className={`grid gap-4 h-full ${getLayoutClasses()}`}>
            {compareItems.map((item, index) => renderComparePanel(item, index))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t px-6 py-4 flex justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              比較モード:{" "}
              {layoutMode === "grid"
                ? "グリッド"
                : layoutMode === "horizontal"
                ? "横並び"
                : "縦並び"}
            </span>
            <span>•</span>
            <span>{compareItems.length}個のプロンプトを比較中</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              エクスポート
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              最適な組み合わせを作成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
