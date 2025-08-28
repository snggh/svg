import { useRef, useEffect } from 'react'
import { useViewport } from '@/hooks/use-viewport'
import { useEditorStore } from '@/stores/editor-store'
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
          if (tool === 'pan' || e.button === 1) { // Middle mouse button or pan tool
            handlePanStart(e)
          }
        }}
        onMouseMove={handlePanMove}
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
          
          {/* Grid background */}
          {gridVisible && (
            <rect width="100%" height="100%" fill="url(#grid)" />
          )}
          
          {/* Main content group with transform */}
          <g
            transform={`scale(${transform.scale}) translate(${transform.translateX}, ${transform.translateY})`}
          >
            {children}
          </g>
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
  const gridSize = 20
  const scaledGridSize = gridSize * transform.scale
  
  // Only show grid when zoomed in enough to see it clearly
  if (scaledGridSize < 5) return null
  
  const offsetX = transform.translateX % scaledGridSize
  const offsetY = transform.translateY % scaledGridSize
  
  return (
    <pattern
      id="grid"
      width={scaledGridSize}
      height={scaledGridSize}
      patternUnits="userSpaceOnUse"
      x={offsetX}
      y={offsetY}
    >
      <path
        d={`M ${scaledGridSize} 0 L 0 0 0 ${scaledGridSize}`}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        opacity="0.3"
      />
    </pattern>
  )
}