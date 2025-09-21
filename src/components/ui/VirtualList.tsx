'use client';

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

interface VisibleRange {
  start: number;
  end: number;
}

function VirtualListInner<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 3,
  className = '',
  onScroll,
  getItemKey
}: VirtualListProps<T>) {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({ start: 0, end: 10 });
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate item heights
  const getItemOffset = useCallback((index: number): number => {
    if (typeof itemHeight === 'number') {
      return index * itemHeight;
    }
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += itemHeight(i);
    }
    return offset;
  }, [itemHeight]);

  const getItemHeightValue = useCallback((index: number): number => {
    return typeof itemHeight === 'number' ? itemHeight : itemHeight(index);
  }, [itemHeight]);

  // Calculate total height
  const totalHeight = useCallback((): number => {
    if (typeof itemHeight === 'number') {
      return items.length * itemHeight;
    }
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += itemHeight(i);
    }
    return total;
  }, [items.length, itemHeight]);

  // Find visible range based on scroll position
  const findVisibleRange = useCallback((scrollTop: number): VisibleRange => {
    if (typeof itemHeight === 'number') {
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const visibleCount = Math.ceil(height / itemHeight);
      const end = Math.min(items.length, start + visibleCount + overscan * 2);
      return { start, end };
    }

    // Variable height items
    let accumulatedHeight = 0;
    let start = 0;
    let end = items.length;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const itemHeightValue = getItemHeightValue(i);
      if (accumulatedHeight + itemHeightValue > scrollTop - overscan * 50) {
        start = i;
        break;
      }
      accumulatedHeight += itemHeightValue;
    }

    // Find end index
    accumulatedHeight = getItemOffset(start);
    for (let i = start; i < items.length; i++) {
      if (accumulatedHeight > scrollTop + height + overscan * 50) {
        end = i + 1;
        break;
      }
      accumulatedHeight += getItemHeightValue(i);
    }

    return { start: Math.max(0, start), end: Math.min(items.length, end) };
  }, [items.length, height, itemHeight, overscan, getItemHeightValue, getItemOffset]);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (!scrollElementRef.current) return;

    const newScrollTop = scrollElementRef.current.scrollTop;
    setScrollTop(newScrollTop);

    const newVisibleRange = findVisibleRange(newScrollTop);
    setVisibleRange(newVisibleRange);

    onScroll?.(newScrollTop);
  }, [findVisibleRange, onScroll]);

  // Update visible range when items or dimensions change
  useEffect(() => {
    const newVisibleRange = findVisibleRange(scrollTop);
    setVisibleRange(newVisibleRange);
  }, [items.length, height, itemHeight, scrollTop, findVisibleRange]);

  // Render visible items
  const visibleItems = [];
  for (let i = visibleRange.start; i < visibleRange.end; i++) {
    const item = items[i];
    const offset = getItemOffset(i);
    const heightValue = getItemHeightValue(i);
    const key = getItemKey ? getItemKey(item, i) : i;

    visibleItems.push(
      <div
        key={key}
        style={{
          position: 'absolute',
          top: offset,
          height: heightValue,
          width: '100%'
        }}
      >
        {renderItem(item, i)}
      </div>
    );
  }

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div
        style={{
          position: 'relative',
          height: totalHeight(),
          width: '100%'
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
}

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;

// Hook for managing virtual list state
export function useVirtualList<T>(
  items: T[],
  containerHeight: number,
  itemHeight: number | ((index: number) => number),
  overscan = 3
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({ start: 0, end: 10 });

  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    let offset = 0;

    if (typeof itemHeight === 'number') {
      offset = index * itemHeight;
    } else {
      for (let i = 0; i < index; i++) {
        offset += itemHeight(i);
      }
    }

    if (align === 'center') {
      const itemHeightValue = typeof itemHeight === 'number' ? itemHeight : itemHeight(index);
      offset = offset - containerHeight / 2 + itemHeightValue / 2;
    } else if (align === 'end') {
      const itemHeightValue = typeof itemHeight === 'number' ? itemHeight : itemHeight(index);
      offset = offset - containerHeight + itemHeightValue;
    }

    return Math.max(0, offset);
  }, [containerHeight, itemHeight]);

  const isItemVisible = useCallback((index: number): boolean => {
    return index >= visibleRange.start && index <= visibleRange.end;
  }, [visibleRange]);

  return {
    scrollTop,
    setScrollTop,
    visibleRange,
    setVisibleRange,
    scrollToIndex,
    isItemVisible
  };
}