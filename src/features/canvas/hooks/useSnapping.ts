import { useState, useCallback } from 'react';
import { CanvasElement } from '@/domain/entities';

export interface GuideLine {
    orientation: 'H' | 'V'; // H = Horizontal line (y-axis), V = Vertical line (x-axis)
    position: number;
}

const SNAP_THRESHOLD = 10;

interface BBox {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    centerX: number;
    centerY: number;
}

export function useSnapping() {
    const [guidelines, setGuidelines] = useState<GuideLine[]>([]);

    const getSnappingOffset = useCallback((
        draggedBox: BBox,
        staticBoxes: BBox[],
        scale: number
    ) => {
        const threshold = SNAP_THRESHOLD / scale;

        let dx = 0;
        let dy = 0;
        const newGuides: GuideLine[] = [];

        // Vertical Guides (Aligning X coordinates for snapping)
        let snappedV = false;
        for (const box of staticBoxes) {
            if (snappedV) break;
            const staticEdgesX = [box.minX, box.centerX, box.maxX];
            const dragEdgesX = [draggedBox.minX, draggedBox.centerX, draggedBox.maxX];

            for (const staticEdge of staticEdgesX) {
                for (let i = 0; i < dragEdgesX.length; i++) {
                    const dragEdge = dragEdgesX[i];
                    if (Math.abs(staticEdge - dragEdge) < threshold) {
                        dx = staticEdge - dragEdge;
                        newGuides.push({ orientation: 'V', position: staticEdge });
                        snappedV = true;
                        break;
                    }
                }
                if (snappedV) break;
            }
        }

        // Horizontal Guides (Aligning Y coordinates for snapping)
        let snappedH = false;
        for (const box of staticBoxes) {
            if (snappedH) break;
            const staticEdgesY = [box.minY, box.centerY, box.maxY];
            const dragEdgesY = [draggedBox.minY, draggedBox.centerY, draggedBox.maxY];

            for (const staticEdge of staticEdgesY) {
                for (let i = 0; i < dragEdgesY.length; i++) {
                    const dragEdge = dragEdgesY[i];
                    if (Math.abs(staticEdge - dragEdge) < threshold) {
                        dy = staticEdge - dragEdge;
                        newGuides.push({ orientation: 'H', position: staticEdge });
                        snappedH = true;
                        break;
                    }
                }
                if (snappedH) break;
            }
        }

        return { dx, dy, guides: newGuides };
    }, []);

    return { guidelines, setGuidelines, getSnappingOffset };
}
