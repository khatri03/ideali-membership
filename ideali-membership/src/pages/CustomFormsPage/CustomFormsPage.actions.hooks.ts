import { useEffect, useRef, useState } from "react";

export function useCustomFormActionsMenu(onEdit: () => void) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) {
      setIsOpen((current) => !current);
      return;
    }

    const gap = 8;
    const menuWidth = 220;
    const menuHeight = 72;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < menuHeight + gap && spaceAbove > menuHeight + gap;

    setMenuPosition({
      top: openUpward ? Math.max(gap, rect.top - menuHeight - gap) : rect.bottom + gap,
      left: Math.max(gap, Math.min(rect.left, window.innerWidth - menuWidth - gap)),
    });
    setIsOpen(true);
  }

  function handleEdit() {
    setIsOpen(false);
    onEdit();
  }

  return {
    buttonRef,
    menuRef,
    isOpen,
    menuPosition,
    openMenu,
    handleEdit,
  };
}
