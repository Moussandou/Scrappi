import { create } from 'zustand';
import { temporal } from 'zundo';
import { CanvasElement } from '@/domain/entities';
import { DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH } from '../constants';

type Tool = 'select' | 'draw' | 'arrow' | 'eraser' | 'hand';

interface CanvasState {
    // Data State
    elements: CanvasElement[];
    selectedIds: string[];
    lastAction?: string;

    // UI State
    activeTool: Tool;
    activeColor: string;
    activeStrokeWidth: number;
    scale: number;
    position: { x: number; y: number };

    // Data Actions
    setElements: (elements: CanvasElement[]) => void;
    addElement: (element: CanvasElement) => void;
    updateElement: (id: string, partial: Partial<CanvasElement>) => void;
    updateElements: (changes: Array<{ id: string; partial: Partial<CanvasElement> }>) => void;
    removeElement: (id: string) => void;
    removeElements: (ids: string[]) => void;
    groupElements: (ids: string[]) => void;
    ungroupElements: (ids: string[]) => void;
    setSelectedIds: (ids: string[]) => void;
    clearSelection: () => void;

    // UI Actions
    setActiveTool: (tool: Tool) => void;
    setActiveColor: (color: string) => void;
    setActiveStrokeWidth: (width: number) => void;
    setScale: (scale: number) => void;
    setPosition: (position: { x: number; y: number }) => void;
}

export const useCanvasStore = create<CanvasState>()(
    temporal(
        (set) => ({
            // Init Data
            elements: [],
            selectedIds: [],

            // Init UI
            activeTool: 'select',
            activeColor: DEFAULT_STROKE_COLOR,
            activeStrokeWidth: DEFAULT_STROKE_WIDTH,
            scale: 1,
            position: { x: 0, y: 0 },

            // Data Actions
            setElements: (elements) => set({ elements }),

            addElement: (element) => set((state) => ({
                elements: [...state.elements, element],
                lastAction: `Ajout ${element.type === 'text' ? 'de texte' : element.type === 'image' ? "d'image" : element.type === 'line' ? 'de ligne' : "d'élément"}`
            })),

            updateElement: (id, partial) => set((state) => ({
                elements: state.elements.map(el => el.id === id ? { ...el, ...partial } : el),
                lastAction: `Modification d'élément`
            })),

            updateElements: (changes) => set((state) => {
                const changesMap = new Map(changes.map(c => [c.id, c.partial]));
                return {
                    elements: state.elements.map(el => {
                        const partial = changesMap.get(el.id);
                        return partial ? { ...el, ...partial } : el;
                    }),
                    lastAction: `Modification multiple`
                };
            }),

            removeElement: (id) => set((state) => ({
                elements: state.elements.filter(el => el.id !== id),
                selectedIds: state.selectedIds.filter(selId => selId !== id),
                lastAction: `Suppression d'élément`
            })),

            removeElements: (ids) => set((state) => ({
                elements: state.elements.filter(el => !ids.includes(el.id)),
                selectedIds: state.selectedIds.filter(selId => !ids.includes(selId)),
                lastAction: `Suppression multiple (${ids.length})`
            })),

            groupElements: (ids) => set((state) => {
                if (ids.length < 2) return state; // Only group 2 or more
                const newGroupId = crypto.randomUUID();
                return {
                    elements: state.elements.map(el => ids.includes(el.id) ? { ...el, groupId: newGroupId } : el),
                    lastAction: `Groupe d'éléments`
                };
            }),

            ungroupElements: (ids) => set((state) => {
                return {
                    elements: state.elements.map(el => ids.includes(el.id) ? { ...el, groupId: undefined } : el),
                    lastAction: `Dégrouper des éléments`
                };
            }),

            setSelectedIds: (ids) => set({ selectedIds: ids }),
            clearSelection: () => set({ selectedIds: [] }),

            // UI Actions
            setActiveTool: (tool) => set({ activeTool: tool }),
            setActiveColor: (color) => set({ activeColor: color }),
            setActiveStrokeWidth: (width) => set({ activeStrokeWidth: width }),
            setScale: (scale) => set({ scale }),
            setPosition: (position) => set({ position })
        }),
        {
            partialize: (state) => ({ elements: state.elements, lastAction: state.lastAction }), // Track elements and their last action
        }
    )
);
