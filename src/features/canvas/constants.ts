export const CANVAS_COLORS = {
    Ink: '#1a1e26',
    Sage: '#8a9a86',
    Red: '#ef4444',
    Blue: '#3b82f6',
    Yellow: '#eab308',
    Pink: '#ec4899',
} as const;

export const DEFAULT_FONT = "Inter";

export const TOOL_HUD_COLORS = [
    { name: 'Ink', value: CANVAS_COLORS.Ink },
    { name: 'Sage', value: CANVAS_COLORS.Sage },
    { name: 'Red', value: CANVAS_COLORS.Red },
    { name: 'Blue', value: CANVAS_COLORS.Blue },
    { name: 'Yellow', value: CANVAS_COLORS.Yellow },
    { name: 'Pink', value: CANVAS_COLORS.Pink },
];

export const SELECTION_STROKE_COLOR = CANVAS_COLORS.Sage;
export const SELECTION_FILL_COLOR = "rgba(138, 154, 134, 0.2)"; // Sage with 0.2 opacity
export const DEFAULT_STROKE_COLOR = CANVAS_COLORS.Ink;
export const DEFAULT_STROKE_WIDTH = 2;
