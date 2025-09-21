import { useEffect, useRef } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeConfig {
  threshold?: number; // Minimum distance for swipe
  preventScrollOnSwipe?: boolean;
}

export function useSwipeGesture(
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) {
  const { threshold = 50, preventScrollOnSwipe = true } = config;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventScrollOnSwipe && touchStartRef.current) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      };

      const deltaX = touchEnd.x - touchStartRef.current.x;
      const deltaY = touchEnd.y - touchStartRef.current.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determine if it's a horizontal or vertical swipe
      if (absDeltaX > absDeltaY && absDeltaX > threshold) {
        // Horizontal swipe
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else if (absDeltaY > absDeltaX && absDeltaY > threshold) {
        // Vertical swipe
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }

      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScrollOnSwipe });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers, threshold, preventScrollOnSwipe]);

  return elementRef;
}

// Hook for attaching swipe gestures to a specific element
export function useSwipe<T extends HTMLElement = HTMLDivElement>(
  handlers: SwipeHandlers,
  config?: SwipeConfig
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const { threshold = 50, preventScrollOnSwipe = true } = config || {};
    let touchStart: { x: number; y: number } | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventScrollOnSwipe && touchStart) {
        const touchCurrent = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };

        const deltaX = Math.abs(touchCurrent.x - touchStart.x);
        const deltaY = Math.abs(touchCurrent.y - touchStart.y);

        // Prevent scroll if it looks like a horizontal swipe
        if (deltaX > deltaY) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart) return;

      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      };

      const deltaX = touchEnd.x - touchStart.x;
      const deltaY = touchEnd.y - touchStart.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > absDeltaY && absDeltaX > threshold) {
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else if (absDeltaY > absDeltaX && absDeltaY > threshold) {
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }

      touchStart = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScrollOnSwipe });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers, config]);

  return ref;
}