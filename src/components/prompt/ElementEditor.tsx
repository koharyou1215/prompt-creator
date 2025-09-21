"use client";

import { useState, useCallback } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import type { Prompt, PromptElement } from "@/types/prompt";
import { ElementCard } from "./ElementCard";
import { Button } from "@/components/ui/button";
import { Plus, Wand2, Grid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface ElementEditorProps {
  prompt: Prompt;
  onElementUpdate: (elementId: string, newContent: string) => void;
  onElementsReorder: (elements: PromptElement[]) => void;
  onElementAdd: (element: Omit<PromptElement, 'id'>) => void;
  onElementRemove: (elementId: string) => void;
  onElementToggleLock: (elementId: string) => void;
}

export function ElementEditor({
  prompt,
  onElementUpdate,
  onElementsReorder,
  onElementAdd,
  onElementRemove,
  onElementToggleLock,
}: ElementEditorProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedElements, setSelectedElements] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = prompt.elements.findIndex((el) => el.id === active.id);
    const newIndex = prompt.elements.findIndex((el) => el.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedElements = arrayMove(prompt.elements, oldIndex, newIndex)
        .map((el, idx) => ({ ...el, position: idx }));
      onElementsReorder(reorderedElements);
    }
  };

  const handleAddElement = () => {
    const newElement: Omit<PromptElement, 'id'> = {
      type: 'custom',
      content: '',
      position: prompt.elements.length,
      isLocked: false,
      variations: [],
    };
    onElementAdd(newElement);
  };

  const handleGenerateVariations = useCallback((elementId: string) => {
    const element = prompt.elements.find(el => el.id === elementId);
    if (!element) return;

    // AIによるバリエーション生成（後で実装）
    console.log('Generate variations for:', element.content);
  }, [prompt.elements]);

  const toggleElementSelection = (elementId: string) => {
    setSelectedElements(prev =>
      prev.includes(elementId)
        ? prev.filter(id => id !== elementId)
        : [...prev, elementId]
    );
  };

  const handleBatchOperation = (operation: 'lock' | 'unlock' | 'delete') => {
    selectedElements.forEach(elementId => {
      switch (operation) {
        case 'lock':
        case 'unlock':
          onElementToggleLock(elementId);
          break;
        case 'delete':
          onElementRemove(elementId);
          break;
      }
    });
    setSelectedElements([]);
  };

  return (
    <div className="space-y-4">
      {/* ツールバー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddElement}
          >
            <Plus className="h-4 w-4 mr-1" />
            要素を追加
          </Button>

          {selectedElements.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchOperation('lock')}
              >
                選択をロック
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchOperation('delete')}
              >
                選択を削除
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 要素リスト */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={prompt.elements.map(el => el.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className={cn(
            viewMode === 'grid'
              ? "grid grid-cols-2 gap-3"
              : "space-y-3"
          )}>
            {prompt.elements.map((element) => (
              <ElementCard
                key={element.id}
                element={element}
                isSelected={selectedElements.includes(element.id)}
                onSelect={() => toggleElementSelection(element.id)}
                onUpdate={(content) => onElementUpdate(element.id, content)}
                onRemove={() => onElementRemove(element.id)}
                onToggleLock={() => onElementToggleLock(element.id)}
                onGenerateVariations={() => handleGenerateVariations(element.id)}
                viewMode={viewMode}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* 要素が空の場合 */}
      {prompt.elements.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Wand2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 mb-4">
            要素がありません。プロンプトを解析するか、手動で追加してください。
          </p>
          <Button onClick={handleAddElement}>
            <Plus className="h-4 w-4 mr-2" />
            最初の要素を追加
          </Button>
        </div>
      )}
    </div>
  );
}