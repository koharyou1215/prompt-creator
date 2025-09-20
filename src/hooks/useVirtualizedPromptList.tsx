import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo } from "react";
import type { Prompt } from "@/types/prompt";

export function useVirtualizedPromptList(
  prompts: Prompt[],
  containerRef: React.RefObject<HTMLElement>
) {
  const rowVirtualizer = useVirtualizer({
    count: prompts.length,
    getScrollElement: () => containerRef.current as HTMLElement | null,
    estimateSize: () => 120,
    overscan: 5,
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

export function useInfinitePrompts() {
  const [prompts, setPrompts] = require("react").useState<Prompt[]>([]);
  const [hasNextPage, setHasNextPage] = require("react").useState(true);
  const [isLoading, setIsLoading] = require("react").useState(false);

  const loadMore = require("react").useCallback(async () => {
    if (isLoading || !hasNextPage) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/prompts?page=${Math.floor(prompts.length / 20) + 1}`
      );
      if (!response.ok) throw new Error("Failed to load");
      const data = await response.json();
      setPrompts((prev) => [...prev, ...data.prompts]);
      setHasNextPage(data.pagination.page < data.pagination.pages);
    } finally {
      setIsLoading(false);
    }
  }, [prompts.length, isLoading, hasNextPage]);

  return { prompts, loadMore, hasNextPage, isLoading, setPrompts } as const;
}
