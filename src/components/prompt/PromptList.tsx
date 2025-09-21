"use client";

import { useState, useEffect } from "react";
import { promptsApi, type Prompt } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Copy, Globe } from "lucide-react";

interface PromptListProps {
  onEdit: (prompt: Prompt) => void;
  refresh?: boolean;
}

export function PromptList({ onEdit, refresh }: PromptListProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const data = await promptsApi.getAll();
      setPrompts(data || []);
    } catch (error) {
      console.error("Failed to load prompts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (!confirm("このプロンプトを削除しますか？")) return;

    try {
      await promptsApi.delete(id);
      await loadPrompts();
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("削除に失敗しました");
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    alert("クリップボードにコピーしました");
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        読み込み中...
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        プロンプトがありません。「新規プロンプト」から作成してください。
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {prompts.map((prompt) => (
        <div
          key={prompt.id}
          className="border rounded-lg p-4 space-y-2 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg">{prompt.title}</h3>
            <span className="text-xs text-gray-500">
              {prompt.language === "ja" ? "日本語" : "English"}
            </span>
          </div>

          <p className="text-sm text-gray-600 line-clamp-3">
            {prompt.content}
          </p>

          {prompt.content_en && (
            <p className="text-sm text-gray-500 line-clamp-2 italic">
              {prompt.content_en}
            </p>
          )}

          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {prompt.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs bg-gray-100 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(prompt)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopy(prompt.content)}
            >
              <Copy className="h-3 w-3" />
            </Button>
            {prompt.content_en && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(prompt.content_en)}
              >
                <Globe className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(prompt.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}