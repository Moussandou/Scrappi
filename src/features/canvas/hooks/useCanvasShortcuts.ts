import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';

export function useCanvasShortcuts(
    isHelpOpen: boolean,
    isEditingTitle: boolean,
    helpRef: React.RefObject<HTMLDivElement | null>,
    setIsHelpOpen: (isOpen: boolean) => void
) {
    const elements = useCanvasStore(state => state.elements);
    const selectedIds = useCanvasStore(state => state.selectedIds);
    const setActiveTool = useCanvasStore(state => state.setActiveTool);
    const removeElements = useCanvasStore(state => state.removeElements);
    const setSelectedIds = useCanvasStore(state => state.setSelectedIds);

    // Temporal actions from zundo
    const undo = useCanvasStore.temporal.getState().undo;
    const redo = useCanvasStore.temporal.getState().redo;

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

            const isMod = e.metaKey || e.ctrlKey;

            if (isMod) {
                if (e.key.toLowerCase() === 'a') {
                    e.preventDefault();
                    setSelectedIds(elementsRef.current.map(el => el.id));
                } else if (e.key.toLowerCase() === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) redo();
                    else undo();
                } else if (e.key.toLowerCase() === 'y') {
                    e.preventDefault();
                    redo();
                    return;
                }
            }

            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedIdsRef.current.length > 0) {
                    removeElements(selectedIdsRef.current);
                }
                return;
            }

            const key = e.key.toLowerCase();
            if (key === 'v') setActiveTool('select');
            else if (key === 'h') setActiveTool('hand');
            else if (key === 'b') setActiveTool('draw');
            else if (key === 'a') setActiveTool('arrow');
            else if (key === 'e') setActiveTool('eraser');
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutsideHelp);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isHelpOpen, setIsHelpOpen, undo, redo, setActiveTool, removeElements, setSelectedIds]);
}
