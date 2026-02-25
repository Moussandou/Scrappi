import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';

const EMPTY_ARRAY: any[] = [];
const NO_OP = () => { };

export function useCanvasShortcuts(
    isHelpOpen: boolean,
    isEditingTitle: boolean,
    helpRef: React.RefObject<HTMLDivElement | null>,
    setIsHelpOpen: (isOpen: boolean) => void
) {
    const elements = useCanvasStore(state => state?.elements) || EMPTY_ARRAY;
    const selectedIds = useCanvasStore(state => state?.selectedIds) || EMPTY_ARRAY;

    const setActiveTool = useCanvasStore(state => state?.setActiveTool) || NO_OP;
    const removeElements = useCanvasStore(state => state?.removeElements) || NO_OP;
    const setSelectedIds = useCanvasStore(state => state?.setSelectedIds) || NO_OP;
    const groupElements = useCanvasStore(state => state?.groupElements) || NO_OP;
    const ungroupElements = useCanvasStore(state => state?.ungroupElements) || NO_OP;

    // Custom History actions directly from store
    const undo = useCanvasStore(state => state?.undo) || NO_OP;
    const redo = useCanvasStore(state => state?.redo) || NO_OP;

    const elementsRef = useRef(elements);
    const selectedIdsRef = useRef(selectedIds);
    const isEditingTitleRef = useRef(isEditingTitle);

    useEffect(() => {
        elementsRef.current = elements;
        selectedIdsRef.current = selectedIds;
        isEditingTitleRef.current = isEditingTitle;
    }, [elements, selectedIds, isEditingTitle]);

    useEffect(() => {
        const handleClickOutsideHelp = (event: MouseEvent) => {
            if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
                setIsHelpOpen(false);
            }
        };

        if (isHelpOpen) document.addEventListener("mousedown", handleClickOutsideHelp);
        else document.removeEventListener("mousedown", handleClickOutsideHelp);

        const handleKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement;
            const isTyping = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA" || activeEl?.getAttribute("contenteditable") === "true";

            if (isTyping || isEditingTitleRef.current) return;

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isMod = isMac ? e.metaKey : e.ctrlKey;

            if (isMod) {
                if (e.key.toLowerCase() === 'g') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        ungroupElements?.(selectedIdsRef.current);
                    } else {
                        groupElements?.(selectedIdsRef.current);
                    }
                } else if (e.key.toLowerCase() === 'a') {
                    e.preventDefault();
                    setSelectedIds?.(elementsRef.current.map(el => el.id));
                } else if (e.key.toLowerCase() === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) redo?.();
                    else undo?.();
                } else if (e.key.toLowerCase() === 'y') {
                    e.preventDefault();
                    redo?.();
                    return;
                }
            }

            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedIdsRef.current.length > 0) {
                    removeElements?.(selectedIdsRef.current);
                }
                return;
            }

            const key = e.key.toLowerCase();
            if (key === 'v') setActiveTool?.('select');
            else if (key === 'h') setActiveTool?.('hand');
            else if (key === 'b') setActiveTool?.('draw');
            else if (key === 'a') setActiveTool?.('arrow');
            else if (key === 'e') setActiveTool?.('eraser');
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutsideHelp);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isHelpOpen, setIsHelpOpen, undo, redo, setActiveTool, removeElements, setSelectedIds, groupElements, ungroupElements]);
}
