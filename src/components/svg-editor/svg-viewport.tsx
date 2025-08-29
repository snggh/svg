import { useRef, useEffect, useState, useCallback, Children, cloneElement, isValidElement } from 'react'
import { useViewport } from '@/hooks/use-viewport'
import { useEditorStore } from '@/stores/editor-store'
import { DrawingOverlay } from './drawing-overlay'
import { cn } from '@/lib/utils'

interface SvgViewportProps {
  className?: string
  children?: React.ReactNode
}

export function SvgViewport({ 
  className, 
  children 
}: SvgViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const { gridVisible, tool, setSelectedPath } = useEditorStore()
  
  const {
    transform,
    screenToSVG,
    handleWheelZoom,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    isPanning,
    isSpacePressed,
  } = useViewport({ containerRef })

  // Handle container resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
        }
      }
    })

    // Set initial dimensions with a slight delay to ensure layout is complete
    const timeoutId = setTimeout(updateDimensions, 0)
    resizeObserver.observe(container)

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
    }
  }, [])

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

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    // Only handle canvas clicks with select tool
    if (tool !== 'select') return
    
    const target = event.target as Element
    
    // Check if clicked on empty space (SVG, grid, or background elements)
    const isEmptySpace = 
      target === event.currentTarget || // SVG itself
      target.tagName === 'rect' && target.getAttribute('fill') === 'url(#grid)' || // Grid background
      target.tagName === 'text' || // Grid numbers
      target.tagName === 'pattern' || // Grid pattern
      target.tagName === 'path' && target.getAttribute('stroke') === 'hsl(var(--border))' // Grid lines
    
    if (isEmptySpace) {
      event.preventDefault()
      event.stopPropagation()
      // Deselect any selected path
      setSelectedPath(undefined)
    }
  }, [tool, setSelectedPath])

  // Handle Esc key to deselect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && tool === 'select') {
        setSelectedPath(undefined)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [tool, setSelectedPath])

  // Don't render SVG until we have valid dimensions
  if (dimensions.width === 0 || dimensions.height === 0) {
    return (
      <div className={cn('relative overflow-hidden bg-white border border-border', className)}>
        <div
          ref={containerRef}
          className="w-full h-full relative select-none"
        />
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-white border border-border', className)}>
      <div
        ref={containerRef}
        className={cn(
          'w-full h-full relative select-none',
          getCursorStyle()
        )}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="absolute inset-0"
          onMouseDown={(e) => {
            // Space + drag has highest priority for panning
            if (isSpacePressed) {
              e.preventDefault()
              e.stopPropagation()
              handlePanStart(e)
            } else if ((tool === 'pan' || e.button === 1) && tool !== 'pen') {
              // Middle mouse button or pan tool, but not when pen is active
              handlePanStart(e)
            }
          }}
          onClick={handleCanvasClick}
        >
          <defs>
            {gridVisible && (
              <GridPattern
                transform={transform}
                width={dimensions.width}
                height={dimensions.height}
              />
            )}
          </defs>
          
          {/* Grid background - outside of transform group */}
          {gridVisible && (
            <>
              <rect 
                width="100%" 
                height="100%" 
                fill="url(#grid)"
                onClick={handleCanvasClick}
                className="cursor-default"
              />
              <GridNumbers
                transform={transform}
                width={dimensions.width}
                height={dimensions.height}
              />
            </>
          )}

          {/* Invisible background for click detection when grid is off */}
          {!gridVisible && (
            <rect 
              width="100%" 
              height="100%" 
              fill="transparent"
              onClick={handleCanvasClick}
              className="cursor-default"
            />
          )}
          
          {/* Main content group with transform */}
          <g
            transform={`translate(${transform.translateX}, ${transform.translateY}) scale(${transform.scale})`}
          >
            {Children.map(children, child => 
              isValidElement(child) 
                ? cloneElement(child, { screenToSVG } as any)
                : child
            )}
          </g>
          
          {/* Drawing overlay for interactive path creation */}
          <DrawingOverlay screenToSVG={screenToSVG} isSpacePressed={isSpacePressed} />
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
  const gridSize = baseGridSize * transform.scale
  const numberSpacing = gridSize // Show number at every grid line
  
  if (numberSpacing < 30) return null // Only show numbers when there's enough space
  
  const gridNumbers = []
  
  // Calculate the starting positions for grid numbers
  const startX = Math.floor(-transform.translateX / numberSpacing) * numberSpacing + transform.translateX
  const startY = Math.floor(-transform.translateY / numberSpacing) * numberSpacing + transform.translateY
  
  // Add horizontal numbers (x-axis) - every grid line
  for (let x = startX; x < width + numberSpacing; x += numberSpacing) {
    if (x >= 0 && x <= width) {
      // Calculate actual grid value - no multiplication
      const gridValue = Math.round((x - transform.translateX) / gridSize)
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
  
  // Add vertical numbers (y-axis) - every grid line
  for (let y = startY; y < height + numberSpacing; y += numberSpacing) {
    if (y >= 15 && y <= height) { // Offset to avoid overlap with x-axis numbers
      // Calculate actual grid value - no multiplication
      const gridValue = Math.round((y - transform.translateY) / gridSize)
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