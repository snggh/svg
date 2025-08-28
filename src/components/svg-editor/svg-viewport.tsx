import { useRef, useEffect } from 'react'
import { useViewport } from '@/hooks/use-viewport'
import { useEditorStore } from '@/stores/editor-store'
import { DrawingOverlay } from './drawing-overlay'
import { cn } from '@/lib/utils'

interface SvgViewportProps {
  width?: number
  height?: number
  className?: string
  children?: React.ReactNode
}

export function SvgViewport({ 
  width = 800, 
  height = 600, 
  className, 
  children 
}: SvgViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { gridVisible, tool } = useEditorStore()
  
  const {
    transform,
    screenToSVG,
    handleWheelZoom,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    isPanning,
  } = useViewport({ containerRef })

  // Handle wheel zoom
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheelZoom, { passive: false })
    
    return () => container.removeEventListener('wheel', handleWheelZoom)
  }, [handleWheelZoom])

  const getCursorStyle = () => {
    if (isPanning) return 'cursor-grabbing'
    
    switch (tool) {
      case 'pan': return 'cursor-grab'
      case 'pen': return 'cursor-crosshair'
      case 'select': return 'cursor-default'
      case 'bezier': return 'cursor-crosshair'
      default: return 'cursor-default'
    }
  }

  return (
    <div className={cn('relative overflow-hidden bg-white border border-border', className)}>
      <div
        ref={containerRef}
        className={cn(
          'w-full h-full relative select-none',
          getCursorStyle()
        )}
        style={{ width, height }}
        onMouseDown={(e) => {
          if ((tool === 'pan' || e.button === 1) && tool !== 'pen') { // Middle mouse button or pan tool, but not when pen is active
            handlePanStart(e)
          }
        }}
        onMouseMove={(e) => {
          if (isPanning) {
            handlePanMove(e)
          }
        }}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0"
        >
          <defs>
            {gridVisible && (
              <GridPattern
                transform={transform}
                width={width}
                height={height}
              />
            )}
          </defs>
          
          {/* Grid background - outside of transform group */}
          {gridVisible && (
            <rect width="100%" height="100%" fill="url(#grid)" />
          )}
          
          {/* Main content group with transform */}
          <g
            transform={`translate(${transform.translateX}, ${transform.translateY}) scale(${transform.scale})`}
          >
            {children}
          </g>
          
          {/* Drawing overlay for interactive path creation - outside transform for proper event handling */}
          <DrawingOverlay screenToSVG={screenToSVG} />
        </svg>
      </div>
    </div>
  )
}

interface GridPatternProps {
  transform: { scale: number; translateX: number; translateY: number }
  width: number
  height: number
}

function GridPattern({ transform }: GridPatternProps) {
  const baseGridSize = 20
  
  // Calculate grid size based on zoom level
  const gridSize = baseGridSize * transform.scale
  
  // Only show grid when it's not too small or too large
  if (gridSize < 5 || gridSize > 200) return null
  
  // Calculate offset to keep grid aligned during pan
  const offsetX = transform.translateX % gridSize
  const offsetY = transform.translateY % gridSize
  
  return (
    <pattern
      id="grid"
      width={gridSize}
      height={gridSize}
      patternUnits="userSpaceOnUse"
      x={offsetX}
      y={offsetY}
    >
      <path
        d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth={Math.max(0.5, Math.min(2, transform.scale))}
        opacity={Math.max(0.1, Math.min(0.5, transform.scale * 0.3))}
      />
    </pattern>
  )
}