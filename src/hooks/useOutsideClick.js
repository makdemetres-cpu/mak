import { useEffect } from 'react';

export function useOutsideClick(ref, active, onOutside) {
  useEffect(() => {
    if (!active) return;

    function handlePointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') onOutside();
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, active, onOutside]);
}
