'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkspaceLayout } from '@/components/workspace/WorkspaceLayout';
import { ElementEditor } from '@/components/prompt/ElementEditor';
import { PromptEditor } from '@/components/prompt/PromptEditor';
import { VersionHistory } from '@/components/version/VersionHistory';
import { VariationGenerator } from '@/components/variation/VariationGenerator';
import { TemplateManager } from '@/components/template/TemplateManager';
import { CharacterGallery } from '@/components/character/CharacterGallery';
import { usePromptStore } from '@/stores/promptStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import {
  FileText, Layout, History, Sparkles, Layers,
  Users, Settings, Search, Plus, Save, Share2
} from 'lucide-react';

export default function WorkspacePage() {
  const {
    prompts,
    selectedPrompt,
    createPrompt,
    updatePrompt,
    selectPrompt
  } = usePromptStore();

  const {
    editMode,
    showPreview,
    selectedElements,
    setEditMode,
    togglePreview,
    selectElement
  } = useWorkspaceStore();

  const [activeTab, setActiveTab] = useState<'edit' | 'elements' | 'history'>('edit');
  const [rightPanel, setRightPanel] = useState<'preview' | 'ai' | 'variations'>('preview');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCharacters, setShowCharacters] = useState(false);

  // Create new prompt
  const handleNewPrompt = () => {
    const newPrompt = createPrompt({
      title: 'New Prompt',
      content: '',
      elements: []
    });
    selectPrompt(newPrompt.id);
  };

  // Save current prompt
  const handleSave = useCallback(() => {
    if (selectedPrompt) {
      // Trigger save logic here
      console.log('Saving prompt:', selectedPrompt);
    }
  }, [selectedPrompt]);

  // Handle element updates
  const handleElementUpdate = (elementId: string, newContent: string) => {
    if (!selectedPrompt) return;

    const updatedElements = selectedPrompt.elements?.map(el =>
      el.id === elementId ? { ...el, content: newContent } : el
    );

    updatePrompt(selectedPrompt.id, {
      elements: updatedElements,
      updatedAt: new Date().toISOString()
    });
  };

  // Handle element reordering
  const handleElementsReorder = (newElements: any[]) => {
    if (!selectedPrompt) return;

    updatePrompt(selectedPrompt.id, {
      elements: newElements,
      updatedAt: new Date().toISOString()
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'n':
            e.preventDefault();
            handleNewPrompt();
            break;
          case 'p':
            e.preventDefault();
            togglePreview();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleSave, togglePreview]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Bar */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">
            Prompt Creator Workspace
          </h1>
          {selectedPrompt && (
            <span className="text-sm text-gray-500">
              {selectedPrompt.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewPrompt}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="新規プロンプト (Ctrl+N)"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="保存 (Ctrl+S)"
          >
            <Save className="w-5 h-5" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="共有"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="設定"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <WorkspaceLayout>
        {/* Left Sidebar - Prompt Structure & Tools */}
        <div slot="left" className="h-full flex flex-col">
          {/* Tool Tabs */}
          <div className="border-b bg-white">
            <div className="flex">
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === 'edit'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-1" />
                編集
              </button>
              <button
                onClick={() => setActiveTab('elements')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === 'elements'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Layout className="w-4 h-4 inline mr-1" />
                要素
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === 'history'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <History className="w-4 h-4 inline mr-1" />
                履歴
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'edit' && (
              <div className="p-4">
                {/* Prompt List */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      プロンプト一覧
                    </h3>
                    <button
                      onClick={handleNewPrompt}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      新規作成
                    </button>
                  </div>
                  <div className="space-y-1">
                    {prompts.map(prompt => (
                      <button
                        key={prompt.id}
                        onClick={() => selectPrompt(prompt.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                          selectedPrompt?.id === prompt.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {prompt.title}
                      </button>
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
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-lg"
                    >
                      <Layers className="w-4 h-4 inline mr-2" />
                      テンプレート
                    </button>
                    <button
                      onClick={() => setShowCharacters(true)}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 rounded-lg"
                    >
                      <Users className="w-4 h-4 inline mr-2" />
                      キャラクター
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'elements' && selectedPrompt && (
              <div className="p-4">
                <ElementStructureTree prompt={selectedPrompt} />
              </div>
            )}

            {activeTab === 'history' && selectedPrompt && (
              <div className="p-4">
                <VersionHistory promptId={selectedPrompt.id} />
              </div>
            )}
          </div>
        </div>

        {/* Center - Main Editor */}
        <div slot="center" className="h-full flex flex-col bg-white">
          {selectedPrompt ? (
            editMode === 'text' ? (
              <PromptEditor
                prompt={selectedPrompt}
                onChange={(content) => updatePrompt(selectedPrompt.id, { content })}
              />
            ) : (
              <ElementEditor
                prompt={selectedPrompt}
                onElementUpdate={handleElementUpdate}
                onElementsReorder={handleElementsReorder}
              />
            )
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg mb-2">プロンプトが選択されていません</p>
                <button
                  onClick={handleNewPrompt}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  新規プロンプトを作成
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Preview & AI */}
        <div slot="right" className="h-full flex flex-col">
          {/* Panel Tabs */}
          <div className="border-b bg-white">
            <div className="flex">
              <button
                onClick={() => setRightPanel('preview')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  rightPanel === 'preview'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                プレビュー
              </button>
              <button
                onClick={() => setRightPanel('ai')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  rightPanel === 'ai'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                AI提案
              </button>
              <button
                onClick={() => setRightPanel('variations')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  rightPanel === 'variations'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-1" />
                バリエーション
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {rightPanel === 'preview' && selectedPrompt && (
              <div className="p-4">
                <PromptPreview prompt={selectedPrompt} />
              </div>
            )}

            {rightPanel === 'ai' && selectedPrompt && (
              <div className="p-4">
                <AIAssistant prompt={selectedPrompt} />
              </div>
            )}

            {rightPanel === 'variations' && selectedPrompt && (
              <VariationGenerator
                prompt={selectedPrompt}
                onVariationSelect={(variation) => {
                  updatePrompt(selectedPrompt.id, { content: variation });
                }}
              />
            )}
          </div>
        </div>
      </WorkspaceLayout>

      {/* Modals */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-6xl h-[80vh]">
            <TemplateManager
              onTemplateSelect={(template) => {
                if (selectedPrompt) {
                  updatePrompt(selectedPrompt.id, {
                    content: template.content,
                    elements: template.elements
                  });
                }
                setShowTemplates(false);
              }}
            />
            <button
              onClick={() => setShowTemplates(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showCharacters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-6xl h-[80vh]">
            <CharacterGallery
              onCharacterSelect={(character) => {
                // Handle character selection
                setShowCharacters(false);
              }}
            />
            <button
              onClick={() => setShowCharacters(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
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
          <div className="text-xs text-gray-500 truncate">{element.content}</div>
        </div>
      ))}
    </div>
  );
}

function PromptPreview({ prompt }: { prompt: any }) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">整形済みプロンプト</h4>
        <div className="text-sm whitespace-pre-wrap">{prompt.content}</div>
      </div>

      {prompt.negativePrompt && (
        <div className="bg-red-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-700 mb-2">ネガティブプロンプト</h4>
          <div className="text-sm whitespace-pre-wrap">{prompt.negativePrompt}</div>
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-700 mb-2">統計情報</h4>
        <div className="text-xs space-y-1">
          <div>文字数: {prompt.content?.length || 0}</div>
          <div>要素数: {prompt.elements?.length || 0}</div>
          <div>更新日時: {new Date(prompt.updatedAt).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function AIAssistant({ prompt }: { prompt: any }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/templates/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.content })
      });
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (prompt.content) {
      getSuggestions();
    }
  }, [prompt.content]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">AI提案</h4>
        <button
          onClick={getSuggestions}
          className="text-xs text-blue-600 hover:text-blue-700"
          disabled={isLoading}
        >
          {isLoading ? '取得中...' : '更新'}
        </button>
      </div>

      {suggestions.map((suggestion, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm font-medium mb-1">{suggestion.name}</div>
          <div className="text-xs text-gray-500 mb-2">{suggestion.reasoning}</div>
          <button className="text-xs text-blue-600 hover:text-blue-700">
            適用
          </button>
        </div>
      ))}
    </div>
  );
}