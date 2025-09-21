"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PromptElement } from "@/types/prompt";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GripVertical,
  Lock,
  Unlock,
  X,
  Edit2,
  Check,
  Sparkles,
  Copy,
} from "lucide-react";

interface ElementCardProps {
  element: PromptElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (content: string) => void;
  onRemove: () => void;
  onToggleLock: () => void;
  onGenerateVariations: () => void;
  viewMode: 'grid' | 'list';
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

export function ElementCard({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  onToggleLock,
  onGenerateVariations,
  viewMode,
}: ElementCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(element.content);
  const [showVariations, setShowVariations] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: element.id,
    disabled: element.isLocked || isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (editValue.trim() !== element.content) {
      onUpdate(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(element.content);
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(element.content);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group transition-all",
        isDragging && "opacity-50 z-50",
        isSelected && "ring-2 ring-blue-500"
      )}
    >
      <div
        className={cn(
          "bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow",
          element.isLocked && "bg-gray-50 border-gray-300",
          viewMode === 'grid' ? "p-3" : "p-4"
        )}
      >
        <div className="flex items-start gap-2">
          {/* ドラッグハンドル */}
          {!element.isLocked && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
          )}

          {/* 選択チェックボックス */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="mt-1"
          />

          {/* メインコンテンツ */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">
                {ELEMENT_TYPE_ICONS[element.type]}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {ELEMENT_TYPE_LABELS[element.type]}
              </span>
              {element.isLocked && (
                <Lock className="h-3 w-3 text-gray-500" />
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-2 py-1 border rounded-md resize-none"
                  rows={2}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSave();
                    }
                    if (e.key === 'Escape') {
                      handleCancel();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>
                    <Check className="h-3 w-3 mr-1" />
                    保存
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    キャンセル
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-800 break-words">
                {element.content || "（内容なし）"}
              </p>
            )}

            {/* バリエーション表示 */}
            {element.variations && element.variations.length > 0 && showVariations && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-gray-500">バリエーション:</p>
                {element.variations.map((variation, index) => (
                  <div
                    key={index}
                    className="text-xs p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setEditValue(variation);
                      setIsEditing(true);
                    }}
                  >
                    {variation}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isEditing && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  disabled={element.isLocked}
                  className="h-7 w-7"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCopy}
                  className="h-7 w-7"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onGenerateVariations}
                  className="h-7 w-7"
                >
                  <Sparkles className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onToggleLock}
                  className="h-7 w-7"
                >
                  {element.isLocked ? (
                    <Unlock className="h-3 w-3" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onRemove}
                  disabled={element.isLocked}
                  className="h-7 w-7 text-red-500 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* バリエーション表示トグル */}
        {element.variations && element.variations.length > 0 && !isEditing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowVariations(!showVariations)}
            className="mt-2 text-xs"
          >
            {showVariations ? "バリエーションを隠す" : `${element.variations.length}個のバリエーション`}
          </Button>
        )}
      </div>
    </div>
  );
}