import { create } from 'zustand';
import { CanvasElement } from '@/domain/entities';
import { DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH } from '../constants';

type Tool = 'select' | 'draw' | 'arrow' | 'eraser' | 'hand';

interface HistoryState {
    elements: CanvasElement[];
    lastAction?: string;
}

interface CanvasState {
    // Data State
    elements: CanvasElement[];
    selectedIds: string[];
    lastAction?: string;
    isProjectLoading: boolean;

    // History State
    pastStates: HistoryState[];
    futureStates: HistoryState[];

    // UI State
    activeTool: Tool;
    activeColor: string;
    activeStrokeWidth: number;
    activeBrushType: 'solid' | 'watercolor' | 'charcoal' | 'marker';
    scale: number;
    position: { x: number; y: number };
    isSnappingEnabled: boolean;
    clipboard: CanvasElement[];

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
    setProjectLoading: (loading: boolean) => void;

    // History Actions
    undo: () => void;
    redo: () => void;
    clearHistory: () => void;

    // UI Actions
    setActiveTool: (tool: Tool) => void;
    setActiveColor: (color: string) => void;
    setActiveStrokeWidth: (width: number) => void;
    setActiveBrushType: (brushType: 'solid' | 'watercolor' | 'charcoal' | 'marker') => void;
    setScale: (scale: number) => void;
    setPosition: (position: { x: number; y: number }) => void;
    setIsSnappingEnabled: (enabled: boolean) => void;
    copySelection: () => void;
    cutSelection: () => void;
    pasteSelection: () => void;
    pasteSelectionAt: (x: number, y: number) => void;
    resetStore: () => void;
}

const HISTORY_LIMIT = 50;

export const useCanvasStore = create<CanvasState>()((set, get) => {
    // Helper to record history before an action
    const saveHistory = (actionLabel: string, currentState: CanvasState) => {
        if (currentState.isProjectLoading) return currentState; // Don't record during load

        const newPast = [...currentState.pastStates, {
            elements: currentState.elements,
            lastAction: currentState.lastAction
        }];

        if (newPast.length > HISTORY_LIMIT) {
            newPast.shift();
        }

        return {
            pastStates: newPast,
            futureStates: [], // Any new action clears the redo stack
            lastAction: actionLabel
        };
    };

    return {
        // Init Data
        elements: [],
        selectedIds: [],
        isProjectLoading: false,
        pastStates: [],
        futureStates: [],
        lastAction: undefined,

        // Init UI
        activeTool: 'select',
        activeColor: DEFAULT_STROKE_COLOR,
        activeStrokeWidth: DEFAULT_STROKE_WIDTH,
        activeBrushType: 'solid',
        scale: 1,
        position: { x: 0, y: 0 },
        isSnappingEnabled: true,
        clipboard: [],

        // Data Actions
        setElements: (elements) => {
            set((state) => {
                const historyUpdates = saveHistory(`Réorganisation des plans`, state);
                return {
                    ...historyUpdates,
                    elements
                };
            });
        },

        addElement: (element) => {
            set((state) => {
                const actionName = `Ajout ${element.type === 'text' ? 'de texte' : element.type === 'image' ? "d'image" : element.type === 'line' ? 'de ligne' : element.type === 'arrow' ? 'de flèche' : "d'élément"}`;
                const historyUpdates = saveHistory(actionName, state);
                return {
                    ...historyUpdates,
                    elements: [...state.elements, element]
                };
            });
        },

        updateElement: (id, partial) => {
            set((state) => {
                const historyUpdates = saveHistory(`Modification d'élément`, state);
                return {
                    ...historyUpdates,
                    elements: state.elements.map(el => el.id === id ? { ...el, ...partial } : el)
                };
            });
        },

        updateElements: (changes) => {
            set((state) => {
                const historyUpdates = saveHistory(`Modification multiple`, state);
                const changesMap = new Map(changes.map(c => [c.id, c.partial]));
                return {
                    ...historyUpdates,
                    elements: state.elements.map(el => {
                        const partial = changesMap.get(el.id);
                        return partial ? { ...el, ...partial } : el;
                    })
                };
            });
        },

        removeElement: (id) => {
            set((state) => {
                const historyUpdates = saveHistory(`Suppression d'élément`, state);
                return {
                    ...historyUpdates,
                    elements: state.elements.filter(el => el.id !== id),
                    selectedIds: state.selectedIds.filter(selId => selId !== id)
                };
            });
        },

        removeElements: (ids) => {
            set((state) => {
                const historyUpdates = saveHistory(`Suppression multiple (${ids.length})`, state);
                return {
                    ...historyUpdates,
                    elements: state.elements.filter(el => !ids.includes(el.id)),
                    selectedIds: state.selectedIds.filter(selId => !ids.includes(selId))
                };
            });
        },

        groupElements: (ids) => set((state) => {
            if (ids.length < 2) return state;
            const historyUpdates = saveHistory(`Groupe d'éléments`, state);
            const newGroupId = crypto.randomUUID();
            return {
                ...historyUpdates,
                elements: state.elements.map(el => ids.includes(el.id) ? { ...el, groupId: newGroupId } : el)
            };
        }),

        ungroupElements: (ids) => set((state) => {
            const historyUpdates = saveHistory(`Dégrouper des éléments`, state);
            return {
                ...historyUpdates,
                elements: state.elements.map(el => ids.includes(el.id) ? { ...el, groupId: undefined } : el)
            };
        }),

        setSelectedIds: (ids) => set({ selectedIds: ids }),
        clearSelection: () => set({ selectedIds: [] }),
        setProjectLoading: (loading) => set({ isProjectLoading: loading }),

        // History Actions
        undo: () => set((state) => {
            if (state.pastStates.length === 0) return state;

            const previousState = state.pastStates[state.pastStates.length - 1];
            const newPast = state.pastStates.slice(0, -1);

            const currentStateRecord: HistoryState = {
                elements: state.elements,
                lastAction: state.lastAction
            };

            return {
                pastStates: newPast,
                futureStates: [currentStateRecord, ...state.futureStates],
                elements: previousState.elements,
                lastAction: previousState.lastAction,
                selectedIds: [] // Clear selection on undo to avoid ghost highlights
            };
        }),

        redo: () => set((state) => {
            if (state.futureStates.length === 0) return state;

            const nextState = state.futureStates[0];
            const newFuture = state.futureStates.slice(1);

            const currentStateRecord: HistoryState = {
                elements: state.elements,
                lastAction: state.lastAction
            };

            return {
                pastStates: [...state.pastStates, currentStateRecord],
                futureStates: newFuture,
                elements: nextState.elements,
                lastAction: nextState.lastAction,
                selectedIds: []
            };
        }),

        clearHistory: () => set({ pastStates: [], futureStates: [], lastAction: undefined }),

        // UI Actions
        setActiveTool: (tool) => set({ activeTool: tool }),
        setActiveColor: (color) => set({ activeColor: color }),
        setActiveStrokeWidth: (width) => set({ activeStrokeWidth: width }),
        setActiveBrushType: (brushType) => set({ activeBrushType: brushType }),
        setScale: (scale) => set({ scale }),
        setPosition: (position) => set({ position }),
        setIsSnappingEnabled: (enabled) => set({ isSnappingEnabled: enabled }),

        copySelection: () => {
            const { elements, selectedIds } = get();
            const selected = elements.filter(el => selectedIds.includes(el.id));
            if (selected.length > 0) {
                set({ clipboard: [...selected] });
            }
        },

        cutSelection: () => {
            const { elements, selectedIds } = get();
            const selected = elements.filter(el => selectedIds.includes(el.id));
            if (selected.length > 0) {
                const historyUpdates = saveHistory(`Couper (${selected.length})`, get());
                set({
                    ...historyUpdates,
                    clipboard: [...selected],
                    elements: elements.filter(el => !selectedIds.includes(el.id)),
                    selectedIds: []
                });
            }
        },

        pasteSelection: () => {
            const { clipboard, elements } = get();
            if (clipboard.length === 0) return;

            const historyUpdates = saveHistory(`Coller (${clipboard.length})`, get());
            const offset = 20;
            const newElements = clipboard.map(el => ({
                ...el,
                id: crypto.randomUUID(),
                x: (el.x || 0) + offset,
                y: (el.y || 0) + offset,
                groupId: el.groupId ? crypto.randomUUID() : undefined // New group ID if it was grouped
            }));

            set({
                ...historyUpdates,
                elements: [...elements, ...newElements],
                selectedIds: newElements.map(el => el.id)
            });
        },

        pasteSelectionAt: (x, y) => {
            const { clipboard, elements, scale, position } = get();
            if (clipboard.length === 0) return;

            const historyUpdates = saveHistory(`Coller ici (${clipboard.length})`, get());

            // Convert screen coordinates to canvas coordinates
            const canvasX = (x - position.x) / scale;
            const canvasY = (y - position.y) / scale;

            // Find center of selected elements to offset them around the paste point
            const minX = Math.min(...clipboard.map(el => el.x || 0));
            const minY = Math.min(...clipboard.map(el => el.y || 0));
            const maxX = Math.max(...clipboard.map(el => (el.x || 0) + (el.width || 0)));
            const maxY = Math.max(...clipboard.map(el => (el.y || 0) + (el.height || 0)));

            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            const newElements = clipboard.map(el => ({
                ...el,
                id: crypto.randomUUID(),
                x: canvasX + ((el.x || 0) - centerX),
                y: canvasY + ((el.y || 0) - centerY),
                groupId: el.groupId ? crypto.randomUUID() : undefined
            }));

            set({
                ...historyUpdates,
                elements: [...elements, ...newElements],
                selectedIds: newElements.map(el => el.id)
            });
        },

        resetStore: () => set({
            elements: [],
            selectedIds: [],
            lastAction: undefined,
            pastStates: [],
            futureStates: [],
            activeTool: 'select',
            scale: 1,
            position: { x: 0, y: 0 }
        })
    };
});
