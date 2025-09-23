"use client";

import React from "react";
import { useState, useEffect, useCallback } from "react";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { ElementEditor } from "@/components/prompt/ElementEditor";
import { PromptEditor } from "@/components/prompt/PromptEditor";
import { VersionHistory } from "@/components/version/VersionHistory";
import { VariationGenerator } from "@/components/variation/VariationGenerator";
import { TemplateManager } from "@/components/template/TemplateManager";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { PromptPreview } from "@/components/prompt/PromptPreview";
import { AIAssistant } from "@/components/prompt/AIAssistant";
import { Button } from "@/components/ui/button";
import { usePromptStore } from "@/stores/promptStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { PromptElement } from "@/types/prompt";
import {
  FileText,
  Layout,
  History,
  Sparkles,
  Layers,
  Users,
  Settings,
  Search,
  Plus,
  Save,
  Share2,
  GitCompare,
  Eye,
  EyeOff,
  FolderPlus,
} from "lucide-react";

// Helper function to convert template elements to prompt elements
const convertTemplateElementsToPromptElements = (
  templateElements?: Array<{
    id: string;
    type: string;
    content: string;
    position?: number;
  }>
): PromptElement[] => {
  if (!templateElements) return [];

  return templateElements.map((element) => ({
    id: element.id,
    type: element.type as PromptElement["type"],
    content: element.content,
    position: element.position || 0,
    isLocked: false,
  }));
};

// 要素をフォーマットしてプロンプトコンテンツを作成
const formatPromptContent = (elements: any[]) => {
  if (!elements || elements.length === 0) return "";

  return elements
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((el) => el.content)
    .filter((content) => content && content.trim())
    .join(", ");
};

export default function WorkspacePage() {
  const { prompts, selectedPrompt, createPrompt, updatePrompt, selectPrompt } =
    usePromptStore();

  const {
    editMode,
    showPreview,
    selectedElements,
    setEditMode,
    togglePreview,
    selectElement,
  } = useWorkspaceStore();

  const [activeTab, setActiveTab] = useState<"edit" | "elements" | "history">(
    "edit"
  );
  const [rightPanel, setRightPanel] = useState<"preview" | "ai" | "variations">(
    "preview"
  );
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCharacters, setShowCharacters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mainMode, setMainMode] = useState<"edit" | "compare" | "history">(
    "edit"
  );
  const [comparePrompts, setComparePrompts] = useState<string[]>([]);

  // Create new prompt
  const handleNewPrompt = () => {
    const newPrompt = createPrompt({
      title: "New Prompt",
      content: "",
      elements: [],
    });
    selectPrompt(newPrompt.id);
  };

  // Save current prompt
  const handleSave = useCallback(() => {
    if (selectedPrompt) {
      // Trigger save logic here
      console.log("Saving prompt:", selectedPrompt);
    }
  }, [selectedPrompt]);

  // Handle element updates
  const handleElementUpdate = (elementId: string, newContent: string) => {
    if (!selectedPrompt) return;

    const updatedElements = selectedPrompt.elements?.map((el) =>
      el.id === elementId ? { ...el, content: newContent } : el
    );

    updatePrompt(selectedPrompt.id, {
      elements: updatedElements,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle element reordering
  const handleElementsReorder = (newElements: any[]) => {
    if (!selectedPrompt) return;

    updatePrompt(selectedPrompt.id, {
      elements: newElements,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle element add
  const handleElementAdd = (element: any) => {
    console.log("handleElementAdd called with:", element);
    console.log("selectedPrompt:", selectedPrompt);

    if (!selectedPrompt) {
      console.log("No selectedPrompt, returning early");
      return;
    }

    const maxPosition = Math.max(
      0,
      ...(selectedPrompt.elements || []).map((el) => el.position || 0)
    );

    // 新しい要素を作成
    const newElement = {
      ...element,
      id: `element_${Date.now()}`,
      position: maxPosition + 1,
    };

    console.log("Adding new element:", newElement);

    try {
      const updatedElements = [...(selectedPrompt.elements || []), newElement];
      updatePrompt(selectedPrompt.id, {
        elements: updatedElements,
        content: formatPromptContent(updatedElements),
        updatedAt: new Date().toISOString(),
      });
      console.log("Element added successfully");
    } catch (error) {
      console.error("Error adding element:", error);
    }
  };

  // Handle element remove
  const handleElementRemove = (elementId: string) => {
    if (!selectedPrompt) return;

    const updatedElements =
      selectedPrompt.elements?.filter((el) => el.id !== elementId) || [];
    updatePrompt(selectedPrompt.id, {
      elements: updatedElements,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle element toggle lock
  const handleElementToggleLock = (elementId: string) => {
    if (!selectedPrompt) return;

    const updatedElements =
      selectedPrompt.elements?.map((el) =>
        el.id === elementId ? { ...el, isLocked: !el.isLocked } : el
      ) || [];

    updatePrompt(selectedPrompt.id, {
      elements: updatedElements,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle prompt selection for comparison
  const handlePromptToggle = (promptId: string) => {
    if (comparePrompts.includes(promptId)) {
      setComparePrompts(comparePrompts.filter((id) => id !== promptId));
    } else {
      setComparePrompts([...comparePrompts, promptId]);
    }
  };

  // Handle main mode change
  const handleMainModeChange = (mode: "edit" | "compare" | "history") => {
    setMainMode(mode);
    if (mode !== "compare") {
      setComparePrompts([]);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "s":
            e.preventDefault();
            handleSave();
            break;
          case "n":
            e.preventDefault();
            handleNewPrompt();
            break;
          case "p":
            e.preventDefault();
            togglePreview();
            break;
          case "c":
            e.preventDefault();
            handleMainModeChange(mainMode === "compare" ? "edit" : "compare");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleSave, togglePreview]);

  return (
    <WorkspaceLayout
      activeMode={mainMode}
      onModeChange={handleMainModeChange}
      onOpenSettings={() => setShowSettings(true)}
      leftPanel={
        <div className="h-full flex flex-col">
          {/* Tool Tabs */}
          <div className="border-b bg-white">
            <div className="flex">
              <button
                onClick={() => setActiveTab("edit")}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === "edit"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}>
                <FileText className="w-4 h-4 inline mr-1" />
                編集
              </button>
              <button
                onClick={() => setActiveTab("elements")}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === "elements"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}>
                <Layout className="w-4 h-4 inline mr-1" />
                要素
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === "history"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}>
                <History className="w-4 h-4 inline mr-1" />
                履歴
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "edit" && (
              <div className="p-4">
                {/* Prompt List */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      {mainMode === "compare"
                        ? "比較するプロンプトを選択"
                        : "マイプロンプト"}
                    </h3>
                    {mainMode === "compare" && (
                      <span className="text-xs text-gray-500">
                        {comparePrompts.length}/3
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {Object.values(prompts).map((prompt) => (
                      <div key={prompt.id} className="relative">
                        {mainMode === "compare" ? (
                          <button
                            onClick={() => handlePromptToggle(prompt.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                              comparePrompts.includes(prompt.id)
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "hover:bg-gray-100"
                            }`}>
                            <div className="flex-1">{prompt.title}</div>
                            {comparePrompts.includes(prompt.id) && (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => selectPrompt(prompt.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                              selectedPrompt?.id === prompt.id
                                ? "bg-blue-50 text-blue-700"
                                : "hover:bg-gray-100"
                            }`}>
                            {prompt.title}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    クイックアクション
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowTemplates(true)}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-lg">
                      <Layers className="w-4 h-4 inline mr-2" />
                      テンプレートから作成
                    </button>
                    <button
                      onClick={handleNewPrompt}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-lg">
                      <Plus className="w-4 h-4 inline mr-2" />
                      新規プロンプト
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "elements" && selectedPrompt && (
              <div className="p-4">
                <ElementStructureTree prompt={selectedPrompt} />
              </div>
            )}

            {activeTab === "history" && selectedPrompt && (
              <div className="p-4">
                <VersionHistory promptId={selectedPrompt.id} />
              </div>
            )}
          </div>
        </div>
      }
      centerPanel={
        <div className="h-full flex flex-col bg-white">
          {/* Edit Mode Toggle */}
          {mainMode === "edit" && selectedPrompt && (
            <div className="border-b bg-gray-50 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">編集モード:</span>
                <button
                  onClick={() => setEditMode("text")}
                  className={`px-3 py-1 text-sm rounded ${
                    editMode === "text"
                      ? "bg-blue-500 text-white"
                      : "bg-white border hover:bg-gray-100"
                  }`}>
                  <FileText className="w-3 h-3 inline mr-1" />
                  テキスト
                </button>
                <button
                  onClick={() => setEditMode("visual")}
                  className={`px-3 py-1 text-sm rounded ${
                    editMode === "visual"
                      ? "bg-blue-500 text-white"
                      : "bg-white border hover:bg-gray-100"
                  }`}>
                  <Layout className="w-3 h-3 inline mr-1" />
                  ビジュアル
                </button>
              </div>
            </div>
          )}

          {mainMode === "compare" && comparePrompts.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">プロンプト比較</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {comparePrompts.length}個のプロンプトを選択中
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMainModeChange("edit")}>
                      <EyeOff className="w-4 h-4 mr-1" />
                      編集に戻る
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 gap-4">
                  {comparePrompts.map((promptId) => {
                    const prompt = prompts[promptId];
                    if (!prompt) return null;

                    return (
                      <div key={promptId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-800">
                            {prompt.title}
                          </h3>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePromptToggle(promptId)}>
                            <EyeOff className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">
                              プロンプト
                            </label>
                            <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm min-h-[100px] whitespace-pre-wrap">
                              {prompt.content}
                            </div>
                          </div>
                          {prompt.elements && prompt.elements.length > 0 && (
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">
                                要素 ({prompt.elements.length}個)
                              </label>
                              <div className="space-y-1">
                                {prompt.elements.slice(0, 3).map((element) => (
                                  <div
                                    key={element.id}
                                    className="text-xs p-2 bg-blue-50 rounded border">
                                    <span className="font-medium">
                                      {element.type}:
                                    </span>{" "}
                                    {element.content}
                                  </div>
                                ))}
                                {prompt.elements.length > 3 && (
                                  <div className="text-xs text-gray-500 text-center">
                                    他 {prompt.elements.length - 3} 個の要素...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : mainMode === "history" && selectedPrompt ? (
            <div className="flex-1 p-4">
              <VersionHistory promptId={selectedPrompt.id} />
            </div>
          ) : mainMode === "edit" && selectedPrompt ? (
            editMode === "text" ? (
              <PromptEditor
                prompt={selectedPrompt}
                onChange={(content) =>
                  updatePrompt(selectedPrompt.id, { content })
                }
              />
            ) : (
              <ElementEditor
                prompt={selectedPrompt}
                onElementUpdate={handleElementUpdate}
                onElementsReorder={handleElementsReorder}
                onElementAdd={handleElementAdd}
                onElementRemove={handleElementRemove}
                onElementToggleLock={handleElementToggleLock}
              />
            )
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg mb-2">
                  {mainMode === "compare"
                    ? "比較するプロンプトを選択してください"
                    : mainMode === "history"
                    ? "履歴を表示するプロンプトを選択してください"
                    : "プロンプトが選択されていません"}
                </p>
                <p className="text-sm mb-4 text-gray-500">
                  {mainMode === "compare"
                    ? "左側のメニューから比較したいプロンプトを選択してください"
                    : mainMode === "history"
                    ? "左側のメニューから履歴を見たいプロンプトを選択してください"
                    : "左側のメニューからプロンプトを選択するか、新規作成してください"}
                </p>
                <button
                  onClick={handleNewPrompt}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  新規プロンプトを作成
                </button>
              </div>
            </div>
          )}
        </div>
      }
      rightPanel={
        <div className="h-full flex flex-col">
          {/* Panel Tabs */}
          <div className="border-b bg-white">
            <div className="flex">
              <button
                onClick={() => setRightPanel("preview")}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  rightPanel === "preview"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}>
                プレビュー
              </button>
              <button
                onClick={() => setRightPanel("ai")}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  rightPanel === "ai"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}>
                AI支援
              </button>
              <button
                onClick={() => setRightPanel("variations")}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  rightPanel === "variations"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}>
                <Sparkles className="w-4 h-4 inline mr-1" />
                バリエーション
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {rightPanel === "preview" && selectedPrompt && (
              <div className="p-4">
                <PromptPreview prompt={selectedPrompt} />
              </div>
            )}

            {rightPanel === "ai" && selectedPrompt && (
              <div className="p-4">
                <AIAssistant prompt={selectedPrompt} />
              </div>
            )}

            {rightPanel === "variations" && selectedPrompt && (
              <VariationGenerator
                prompt={selectedPrompt}
                onVariationSelect={(variation) => {
                  updatePrompt(selectedPrompt.id, { content: variation });
                }}
              />
            )}
          </div>
        </div>
      }>
      {/* Modals */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-6xl h-[80vh] relative">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">テンプレート管理</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-auto h-[calc(100%-5rem)]">
              <TemplateManager
                currentPrompt={
                  selectedPrompt
                    ? {
                        content: selectedPrompt.content,
                        elements: selectedPrompt.elements,
                      }
                    : undefined
                }
                onTemplateSelect={(template) => {
                  if (selectedPrompt) {
                    updatePrompt(selectedPrompt.id, {
                      content: template.content,
                      elements: convertTemplateElementsToPromptElements(
                        template.elements
                      ),
                    });
                  }
                  setShowTemplates(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </WorkspaceLayout>
  );
}

// Helper Components
function ElementStructureTree({ prompt }: { prompt: any }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700 mb-2">要素構造</h3>
      {prompt.elements?.map((element: any) => (
        <div key={element.id} className="pl-4 border-l-2 border-gray-200">
          <div className="text-sm font-medium">{element.type}</div>
          <div className="text-xs text-gray-500 truncate">
            {element.content}
          </div>
        </div>
      ))}
    </div>
  );
}
