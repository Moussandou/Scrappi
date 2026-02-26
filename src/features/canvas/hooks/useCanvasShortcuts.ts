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
    const copySelection = useCanvasStore(state => state?.copySelection) || NO_OP;
    const cutSelection = useCanvasStore(state => state?.cutSelection) || NO_OP;
    const pasteSelection = useCanvasStore(state => state?.pasteSelection) || NO_OP;

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
            const isTyping = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA" || (activeEl as HTMLElement)?.isContentEditable;

            if (isTyping || isEditingTitleRef.current) return;

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isMod = isMac ? e.metaKey : e.ctrlKey;
            const key = e.key.toLowerCase();

            // 1. Modifier Shortcuts (Cmd/Ctrl + Key)
            if (isMod) {
                if (key === 'g') {
                    e.preventDefault();
                    if (e.shiftKey) ungroupElements?.(selectedIdsRef.current);
                    else groupElements?.(selectedIdsRef.current);
                    return;
                }

                if (key === 'a') {
                    e.preventDefault();
                    setSelectedIds?.(elementsRef.current.map(el => el.id));
                    return;
                }

                if (key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) redo?.();
                    else undo?.();
                    return;
                }

                if (key === 'y') {
                    e.preventDefault();
                    redo?.();
                    return;
                }

                if (key === 'c') {
                    e.preventDefault();
                    copySelection?.();
                    return;
                }

                if (key === 'x') {
                    e.preventDefault();
                    cutSelection?.();
                    return;
                }

                if (key === 'v') {
                    e.preventDefault();
                    pasteSelection?.();
                    return;
                }

                // If Cmd is pressed but we didn't match anything above, don't allow tool switches
                return;
            }

            // 2. Global Functional Keys (No Modifiers)
            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedIdsRef.current.length > 0) {
                    e.preventDefault();
                    removeElements?.(selectedIdsRef.current);
                }
                return;
            }

            // 3. Single-Key Tool Shortcuts (No Modifiers, No Alt)
            if (e.altKey) return;

            switch (key) {
                case 'v': setActiveTool?.('select'); break;
                case 'h': setActiveTool?.('hand'); break;
                case 'b': setActiveTool?.('draw'); break;
                case 'a': setActiveTool?.('arrow'); break;
                case 'e': setActiveTool?.('eraser'); break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutsideHelp);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isHelpOpen, setIsHelpOpen, undo, redo, setActiveTool, removeElements, setSelectedIds, groupElements, ungroupElements]);
}
