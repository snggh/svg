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
    handleSpacePanStart,
    handlePanMove,
    handlePanEnd,
    isPanning,
    isSpacePressed,
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
    if (isSpacePressed) return 'cursor-grab'
    
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
          } else {
            // Handle space + drag for panning
            handleSpacePanStart(e)
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
            <>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <GridNumbers
                transform={transform}
                width={width}
                height={height}
              />
            </>
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
        strokeWidth={Math.max(1, Math.min(3, transform.scale * 1.5))}
        opacity={Math.max(0.2, Math.min(0.6, transform.scale * 0.4 + 0.2))}
      />
    </pattern>
  )
}

interface GridNumbersProps {
  transform: { scale: number; translateX: number; translateY: number }
  width: number
  height: number
}

function GridNumbers({ transform, width, height }: GridNumbersProps) {
  const baseGridSize = 20
  const numberSpacing = baseGridSize * 5 * transform.scale // Every 5 grid units
  
  if (numberSpacing < 50) return null // Only show numbers when there's enough space
  
  const gridNumbers = []
  
  // Calculate the starting positions for grid numbers
  const startX = Math.floor(-transform.translateX / numberSpacing) * numberSpacing + transform.translateX
  const startY = Math.floor(-transform.translateY / numberSpacing) * numberSpacing + transform.translateY
  
  // Add horizontal numbers (x-axis)
  for (let x = startX; x < width + numberSpacing; x += numberSpacing) {
    if (x >= 0 && x <= width) {
      const gridValue = Math.round((x - transform.translateX) / (baseGridSize * transform.scale)) * 5
      gridNumbers.push(
        <text
          key={`x-${gridValue}`}
          x={x}
          y="15"
          fill="hsl(var(--muted-foreground))"
          fontSize="10"
          textAnchor="middle"
          className="pointer-events-none select-none"
        >
          {gridValue}
        </text>
      )
    }
  }
  
  // Add vertical numbers (y-axis)
  for (let y = startY; y < height + numberSpacing; y += numberSpacing) {
    if (y >= 15 && y <= height) { // Offset to avoid overlap with x-axis numbers
      const gridValue = Math.round((y - transform.translateY) / (baseGridSize * transform.scale)) * 5
      gridNumbers.push(
        <text
          key={`y-${gridValue}`}
          x="15"
          y={y + 3}
          fill="hsl(var(--muted-foreground))"
          fontSize="10"
          textAnchor="start"
          className="pointer-events-none select-none"
        >
          {gridValue}
        </text>
      )
    }
  }
  
  return <g className="grid-numbers">{gridNumbers}</g>
}