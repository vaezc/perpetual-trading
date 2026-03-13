import { useState, useCallback, useRef } from 'react';

/**
 * Provides a draggable resize handle for a fixed-size panel.
 * @param initial - initial size in px
 * @param min - minimum size in px
 * @param max - maximum size in px
 * @param axis - 'x' for horizontal resize, 'y' for vertical
 * @param reversed - flip delta direction (for right/bottom anchored panels)
 */
export function useDragResize(
  initial: number,
  min: number,
  max: number,
  axis: 'x' | 'y',
  reversed = false,
) {
  const [size, setSize] = useState(initial);
  const drag = useRef<{ start: number; init: number } | null>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      drag.current = { start: axis === 'x' ? e.clientX : e.clientY, init: size };

      const onMove = (ev: MouseEvent) => {
        if (!drag.current) return;
        const delta = (axis === 'x' ? ev.clientX : ev.clientY) - drag.current.start;
        setSize(Math.min(max, Math.max(min, drag.current.init + (reversed ? -delta : delta))));
      };

      const onUp = () => {
        drag.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size, min, max, axis, reversed],
  );

  return { size, onMouseDown };
}
