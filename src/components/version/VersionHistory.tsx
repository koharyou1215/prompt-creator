"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { Version } from "@/types/version";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  Clock,
  Eye,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VersionHistoryProps {
  promptId: string;
  currentVersionId?: string;
  onRestore?: (version: Version) => void;
  onCompare?: (versionA: Version, versionB: Version) => void;
}

export function VersionHistory({
  promptId,
  currentVersionId,
  onRestore,
  onCompare,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadVersions();
  }, [promptId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}/versions`);
      if (!res.ok) throw new Error("Failed to load versions");
      const data = await res.json();
      setVersions(data.versions || []);
    } catch (error) {
      console.error("Error loading versions:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const toggleSelected = (versionId: string) => {
    const newSelected = new Set(selectedVersions);
    if (newSelected.has(versionId)) {
      newSelected.delete(versionId);
    } else {
      if (newSelected.size >= 2) {
        // 最大2つまで選択可能
        const first = Array.from(newSelected)[0];
        newSelected.delete(first);
      }
      newSelected.add(versionId);
    }
    setSelectedVersions(newSelected);
  };

  const handleCompare = () => {
    if (selectedVersions.size !== 2) return;
    const [v1Id, v2Id] = Array.from(selectedVersions);
    const version1 = versions.find((v) => v.id === v1Id);
    const version2 = versions.find((v) => v.id === v2Id);
    if (version1 && version2 && onCompare) {
      onCompare(version1, version2);
    }
  };

  const renderChanges = (changes: any[]) => {
    return (
      <div className="space-y-1 text-sm">
        {changes.map((change, index) => (
          <div key={index} className="flex items-start gap-2">
            <span
              className={cn(
                "px-1 py-0.5 rounded text-xs font-medium",
                change.type === "add" && "bg-green-100 text-green-700",
                change.type === "remove" && "bg-red-100 text-red-700",
                change.type === "modify" && "bg-yellow-100 text-yellow-700"
              )}
            >
              {change.type === "add" && "+"}
              {change.type === "remove" && "-"}
              {change.type === "modify" && "~"}
            </span>
            <div className="flex-1">
              {change.elementType && (
                <span className="font-medium">{change.elementType}: </span>
              )}
              {change.type === "modify" ? (
                <div>
                  <div className="line-through text-gray-400">{change.before}</div>
                  <div className="text-gray-800">{change.after}</div>
                </div>
              ) : (
                <span>{change.after || change.before}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          <h3 className="font-medium">バージョン履歴</h3>
          <span className="text-sm text-gray-500">({versions.length}件)</span>
        </div>
        {selectedVersions.size === 2 && (
          <Button size="sm" onClick={handleCompare}>
            2つのバージョンを比較
          </Button>
        )}
      </div>

      {/* タイムライン */}
      <div className="relative">
        {/* タイムラインの縦線 */}
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>

        {/* バージョンリスト */}
        <div className="space-y-4">
          {versions.map((version, index) => {
            const isExpanded = expandedVersions.has(version.id);
            const isSelected = selectedVersions.has(version.id);
            const isCurrent = version.id === currentVersionId;

            return (
              <div key={version.id} className="relative">
                {/* タイムラインのドット */}
                <div
                  className={cn(
                    "absolute left-2 w-4 h-4 rounded-full border-2 bg-white",
                    isCurrent
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  )}
                ></div>

                {/* バージョンカード */}
                <div
                  className={cn(
                    "ml-10 border rounded-lg transition-all",
                    isSelected && "ring-2 ring-blue-500",
                    isCurrent && "bg-blue-50 border-blue-300"
                  )}
                >
                  {/* ヘッダー */}
                  <div
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleExpanded(version.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {onCompare && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelected(version.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <span className="font-medium">
                            バージョン {version.versionNumber}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              現在
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(version.createdAt), {
                              addSuffix: true,
                              locale: ja,
                            })}
                          </span>
                          {version.comment && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {version.comment}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isCurrent && onRestore && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRestore(version);
                            }}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            復元
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 詳細 */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t">
                      <div className="mt-3 space-y-3">
                        {/* 変更内容 */}
                        {version.changes && version.changes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">変更内容</h4>
                            {renderChanges(version.changes)}
                          </div>
                        )}

                        {/* プロンプト内容 */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">プロンプト</h4>
                          <div className="p-3 bg-gray-50 rounded-md text-sm">
                            {version.content}
                          </div>
                        </div>

                        {/* 要素 */}
                        {version.elements && version.elements.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">
                              要素 ({version.elements.length}個)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {version.elements.map((element: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-gray-100 text-xs rounded"
                                >
                                  {element.type}: {element.content}
                                </span>
                              ))}
                            </div>
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

      {/* バージョンが空の場合 */}
      {versions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>まだバージョン履歴がありません</p>
        </div>
      )}
    </div>
  );
}