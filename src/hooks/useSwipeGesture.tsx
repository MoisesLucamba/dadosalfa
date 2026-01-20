import { useEffect, useRef, useCallback } from "react";

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  edgeWidth?: number;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  edgeWidth = 30,
}: SwipeConfig) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isEdgeSwipe = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = null;
    
    // Check if touch started from edge (for opening menu)
    isEdgeSwipe.current = touchStartX.current <= edgeWidth;
  }, [edgeWidth]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null || touchEndX.current === null) {
      return;
    }

    const deltaX = touchEndX.current - touchStartX.current;
    const absDeltaX = Math.abs(deltaX);

    // Only trigger if swipe is significant enough
    if (absDeltaX < threshold) {
      touchStartX.current = null;
      touchEndX.current = null;
      return;
    }

    // Swipe right (open menu) - only from edge
    if (deltaX > 0 && isEdgeSwipe.current && onSwipeRight) {
      onSwipeRight();
    }
    
    // Swipe left (close menu) - from anywhere
    if (deltaX < 0 && onSwipeLeft) {
      onSwipeLeft();
    }

    touchStartX.current = null;
    touchEndX.current = null;
    isEdgeSwipe.current = false;
  }, [threshold, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
}
