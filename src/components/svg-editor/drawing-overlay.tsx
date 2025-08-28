import { useEffect } from 'react'
import { useDrawing } from '@/hooks/use-drawing'
import { useEditorStore } from '@/stores/editor-store'
import type { SVGPoint } from '@/types'

interface DrawingOverlayProps {
  screenToSVG: (screenX: number, screenY: number) => SVGPoint
}

export function DrawingOverlay({ screenToSVG }: DrawingOverlayProps) {
  const { tool } = useEditorStore()
  const {
    isDrawing,
    currentPath,
    handleMouseDown,
    handleMouseMove,
    handleDoubleClick,
    handleKeyPress,
  } = useDrawing({ screenToSVG })

  // Handle keyboard events
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  if (tool !== 'pen') return null

  return (
    <>
      {/* Invisible overlay for capturing mouse events */}
      <rect
        width="100%"
        height="100%"
        fill="transparent"
        className="cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* Drawing status indicator */}
      {isDrawing && currentPath && (
        <g className="drawing-preview">
          {/* Current path being drawn */}
          <text
            x="10"
            y="30"
            fill="hsl(var(--muted-foreground))"
            fontSize="12"
            className="pointer-events-none"
          >
            Drawing... (Double-click or press Enter/Esc to finish)
          </text>
        </g>
      )}
    </>
  )
}