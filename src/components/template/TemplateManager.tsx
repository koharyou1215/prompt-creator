"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Grid,
  List,
  Filter,
  Download,
  Upload,
  Star,
  StarOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
} from "lucide-react";
import { useTemplateStore, type Template } from "@/stores/templateStore";

interface TemplateManagerProps {
  onTemplateSelect?: (template: Template) => void;
  onTemplateCreate?: () => void;
  currentPrompt?: { content: string; elements?: any[] };
}

export function TemplateManager({
  onTemplateSelect,
  onTemplateCreate,
  currentPrompt,
}: TemplateManagerProps) {
  const {
    templates,
    categories,
    loadTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  } = useTemplateStore();

  // Local state for UI
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get filtered templates
  const filteredTemplates = Object.values(templates).filter((template) => {
    if (searchQuery) {
      return (
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [favoriteTemplates, setFavoriteTemplates] = useState<Set<string>>(
    new Set()
  );
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "usage" | "date">("usage");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("ポートレート");
  const [newTemplateType, setNewTemplateType] = useState<Template["type"]>("custom");

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const handleCreateTemplate = () => {
    setShowCreateModal(true);
    // Pre-fill with current prompt if available
    if (currentPrompt) {
      setNewTemplateName("");
      setNewTemplateDescription("");
    }
  };

  const handleSaveNewTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert("テンプレート名を入力してください");
      return;
    }

    try {
      await addTemplate({
        name: newTemplateName,
        description: newTemplateDescription,
        content: currentPrompt?.content || "",
        type: newTemplateType,
        category: newTemplateCategory,
        tags: [],
        elements: currentPrompt?.elements,
        isPublic: false,
      });

      setShowCreateModal(false);
      setNewTemplateName("");
      setNewTemplateDescription("");
      alert("テンプレートを保存しました");
    } catch (error) {
      console.error("Failed to create template:", error);
      alert("テンプレートの保存に失敗しました");
    }
  };

  const handleToggleFavorite = async (
    templateId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setFavoriteTemplates((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(templateId)) {
        newFavorites.delete(templateId);
      } else {
        newFavorites.add(templateId);
      }
      return newFavorites;
    });
  };

  const handleDuplicateTemplate = async (
    template: Template,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      // テンプレートを複製（新しいIDで作成）
      const duplicatedTemplate = {
        ...template,
        name: `${template.name} (コピー)`,
        usageCount: 0,
      };
      // idとタイムスタンプを除外して新規作成
      const { id, createdAt, updatedAt, ...newTemplate } = duplicatedTemplate;
      await addTemplate(newTemplate);
    } catch (error) {
      console.error("テンプレートの複製に失敗しました:", error);
    }
  };

  const handleDeleteTemplate = async (
    templateId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (confirm("このテンプレートを削除しますか？")) {
      await deleteTemplate(templateId);
    }
  };

  const handleExportTemplate = (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // テンプレートをJSONファイルとしてエクスポート
      const exportData = {
        ...template,
        exportedAt: new Date().toISOString(),
        version: "1.0.0"
      };
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `template-${template.name.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("テンプレートのエクスポートに失敗しました:", error);
    }
  };

  const handleImportTemplate = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const templateData = JSON.parse(event.target?.result as string);
          // インポートデータから新規テンプレートを作成
          const { id, createdAt, updatedAt, exportedAt, version, ...importedTemplate } = templateData;
          await addTemplate({
            ...importedTemplate,
            name: importedTemplate.name || "インポートされたテンプレート",
            usageCount: 0,
          });
          // ファイル入力をリセット
          if (e.target) {
            e.target.value = '';
          }
        } catch (error) {
          console.error("Failed to import template:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const getSortedTemplates = () => {
    const filtered =
      filterType === "all"
        ? filteredTemplates
        : filteredTemplates.filter((t) => t.type === filterType);

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "usage":
          return b.usageCount - a.usageCount;
        case "date":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        default:
          return 0;
      }
    });
  };

  const renderTemplateCard = (template: Template) => (
    <div
      key={template.id}
      onClick={() => handleTemplateClick(template)}
      className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 line-clamp-1">
            {template.name}
          </h4>
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">
            {template.description}
          </p>
        </div>
        <button
          onClick={(e) => handleToggleFavorite(template.id, e)}
          className="p-1 hover:bg-gray-100 rounded">
          {favoriteTemplates.has(template.id) ? (
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          ) : (
            <StarOff className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
          {template.category}
        </span>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
          {template.type}
        </span>
        {template.isPublic ? (
          <Unlock className="w-3 h-3 text-green-600" />
        ) : (
          <Lock className="w-3 h-3 text-gray-400" />
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <span>使用回数: {template.usageCount}</span>
        <span>•</span>
        <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
      </div>

      <div className="flex items-center gap-1 mt-3 pt-3 border-t">
        <button
          onClick={(e) => handleDuplicateTemplate(template, e)}
          className="flex-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded flex items-center justify-center gap-1">
          <Copy className="w-3 h-3" />
          複製
        </button>
        <button
          onClick={(e) => handleExportTemplate(template, e)}
          className="flex-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded flex items-center justify-center gap-1">
          <Download className="w-3 h-3" />
          出力
        </button>
        <button
          onClick={(e) => handleDeleteTemplate(template.id, e)}
          className="flex-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded flex items-center justify-center gap-1">
          <Trash2 className="w-3 h-3" />
          削除
        </button>
      </div>
    </div>
  );

  const renderTemplateList = (template: Template) => (
    <div
      key={template.id}
      onClick={() => handleTemplateClick(template)}
      className="bg-white border-b hover:bg-gray-50 px-4 py-3 cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex-1 flex items-center gap-4">
          <button
            onClick={(e) => handleToggleFavorite(template.id, e)}
            className="p-1 hover:bg-gray-200 rounded">
            {favoriteTemplates.has(template.id) ? (
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            ) : (
              <StarOff className="w-4 h-4 text-gray-400" />
            )}
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{template.name}</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                {template.category}
              </span>
              {template.isPublic ? (
                <Unlock className="w-3 h-3 text-green-600" />
              ) : (
                <Lock className="w-3 h-3 text-gray-400" />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {template.description}
            </p>
          </div>

          <div className="text-sm text-gray-500 text-right">
            <div>使用: {template.usageCount}回</div>
            <div>{new Date(template.updatedAt).toLocaleDateString()}</div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => handleDuplicateTemplate(template, e)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded">
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => handleExportTemplate(template, e)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded">
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => handleDeleteTemplate(template.id, e)}
              className="p-2 text-red-600 hover:bg-red-50 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-50 p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="テンプレート検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">カテゴリ</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  selectedCategory === null
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-100 text-gray-600"
                }`}>
                すべて ({Object.values(templates).length})
              </button>
              {["all", "portrait", "landscape", "object", "abstract"].map(
                (category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      selectedCategory === category
                        ? "bg-blue-100 text-blue-700"
                        : "hover:bg-gray-100 text-gray-600"
                    }`}>
                    {category} (0)
                  </button>
                )
              )}
            </div>
          </div>

          {/* Filter by Type */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">タイプ</h3>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="all">すべて</option>
              <option value="portrait">ポートレート</option>
              <option value="landscape">風景</option>
              <option value="character">キャラクター</option>
              <option value="object">オブジェクト</option>
              <option value="abstract">抽象</option>
              <option value="custom">カスタム</option>
            </select>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleCreateTemplate}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              新規テンプレート
            </button>

            <label className="w-full py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              インポート
              <input
                type="file"
                accept=".json"
                onChange={handleImportTemplate}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">テンプレート</h2>
            <span className="text-sm text-gray-500">
              {getSortedTemplates().length}件
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border rounded-lg text-sm">
              <option value="usage">使用頻度順</option>
              <option value="name">名前順</option>
              <option value="date">更新日順</option>
            </select>

            {/* View Mode */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded ${
                  viewMode === "grid" ? "bg-white shadow-sm" : ""
                }`}>
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1 rounded ${
                  viewMode === "list" ? "bg-white shadow-sm" : ""
                }`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {getSortedTemplates().map(renderTemplateCard)}
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              {getSortedTemplates().map(renderTemplateList)}
            </div>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">新規テンプレート作成</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  テンプレート名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="例: ポートレート基本設定"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  説明
                </label>
                <textarea
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                  placeholder="このテンプレートの説明を入力..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  カテゴリ
                </label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  タイプ
                </label>
                <select
                  value={newTemplateType}
                  onChange={(e) => setNewTemplateType(e.target.value as Template["type"])}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="portrait">ポートレート</option>
                  <option value="landscape">風景</option>
                  <option value="scene">シーン</option>
                  <option value="abstract">抽象</option>
                  <option value="custom">カスタム</option>
                </select>
              </div>

              {currentPrompt && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    プロンプト内容
                  </label>
                  <div className="p-3 bg-gray-50 rounded border text-sm max-h-32 overflow-y-auto">
                    {currentPrompt.content || "(空のプロンプト)"}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTemplateName("");
                  setNewTemplateDescription("");
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveNewTemplate}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
