import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useCallback, useState, RefObject } from "react";
import type { Prompt } from "@/types/prompt";

export function useVirtualizedPromptList(
  prompts: Prompt[],
  containerRef: RefObject<HTMLElement>
) {
  const rowVirtualizer = useVirtualizer({
    count: prompts.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 120, // 各プロンプト項目の推定高さ
    overscan: 5, // 画面外の項目も先読み
  });

  return useMemo(
    () => ({
      virtualItems: rowVirtualizer.getVirtualItems(),
      totalSize: rowVirtualizer.getTotalSize(),
      scrollToIndex: rowVirtualizer.scrollToIndex,
    }),
    [rowVirtualizer]
  );
}

// 無限スクロール対応
export function useInfinitePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasNextPage) return;

    setIsLoading(true);
    setError(null);

    try {
      const page = Math.floor(prompts.length / 20) + 1;
      const response = await fetch(`/api/prompts?page=${page}&limit=20`);

      if (!response.ok) {
        throw new Error("Failed to load prompts");
      }

      const data = await response.json();

      setPrompts((prev) => [...prev, ...data.prompts]);
      setHasNextPage(data.pagination.page < data.pagination.pages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [prompts.length, isLoading, hasNextPage]);

  const reset = useCallback(() => {
    setPrompts([]);
    setHasNextPage(true);
    setError(null);
  }, []);

  return {
    prompts,
    loadMore,
    hasNextPage,
    isLoading,
    error,
    reset,
  };
}

// 検索とフィルタリング
export function usePromptSearch(prompts: Prompt[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "title">(
    "updatedAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredAndSortedPrompts = useMemo(() => {
    let filtered = prompts;

    // 検索クエリでフィルタリング
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (prompt) =>
          prompt.title.toLowerCase().includes(query) ||
          prompt.content.toLowerCase().includes(query) ||
          prompt.tags.some((tag) => tag.name.toLowerCase().includes(query))
      );
    }

    // タグでフィルタリング
    if (selectedTags.length > 0) {
      filtered = filtered.filter((prompt) =>
        selectedTags.every((tag) =>
          prompt.tags.some((promptTag) => promptTag.name === tag)
        )
      );
    }

    // ソート
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
        default:
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [prompts, searchQuery, selectedTags, sortBy, sortOrder]);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    prompts.forEach((prompt) => {
      prompt.tags.forEach((tag) => tagSet.add(tag.name));
    });
    return Array.from(tagSet).sort();
  }, [prompts]);

  return {
    searchQuery,
    setSearchQuery,
    selectedTags,
    setSelectedTags,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredPrompts: filteredAndSortedPrompts,
    availableTags,
  };
}

// パフォーマンス最適化されたプロンプトリスト
export function useOptimizedPromptList(prompts: Prompt[]) {
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  // メモ化されたプロンプトの準備
  const memoizedPrompts = useMemo(() => {
    return prompts.map((prompt) => ({
      ...prompt,
      // 重い計算を事前に実行
      elementCount: prompt.elements.length,
      tagNames: prompt.tags.map((t) => t.name),
      lastModified: new Date(prompt.updatedAt).toLocaleDateString(),
    }));
  }, [prompts]);

  const selectedPrompt = useMemo(() => {
    return selectedPromptId
      ? memoizedPrompts.find((p) => p.id === selectedPromptId) || null
      : null;
  }, [memoizedPrompts, selectedPromptId]);

  const selectPrompt = useCallback((id: string | null) => {
    setSelectedPromptId(id);
  }, []);

  return {
    prompts: memoizedPrompts,
    selectedPrompt,
    selectPrompt,
    selectedPromptId,
  };
}
