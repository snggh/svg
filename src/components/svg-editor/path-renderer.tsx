import { useMemo, useCallback, useRef, useEffect, memo } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { commandsToPixelPathString } from '@/utils/svg/path-parser'
import type { SVGPath, SVGPoint } from '@/types'

interface PathRendererProps {
  className?: string
  screenToSVG?: (screenX: number, screenY: number) => SVGPoint
}

export function PathRenderer({ className, screenToSVG }: PathRendererProps) {
  const { paths, selectedPath } = useEditorStore()

  return (
    <g className={className}>
      {paths.map(path => (
        <PathElement
          key={path.id}
          path={path}
          isSelected={path.id === selectedPath}
          hasSelection={selectedPath !== undefined}
          screenToSVG={screenToSVG}
        />
      ))}
    </g>
  )
}

interface PathElementProps {
  path: SVGPath
  isSelected: boolean
  hasSelection: boolean
  screenToSVG?: (screenX: number, screenY: number) => SVGPoint
}

function PathElement({ path, isSelected, hasSelection, screenToSVG }: PathElementProps) {
  const { tool, setSelectedPath } = useEditorStore()
  const pathString = useMemo(() => {
    return commandsToPixelPathString(path.commands)
  }, [path.commands])

  const strokeWidth = useMemo(() => {
    return (path.strokeWidth ?? 2) + (isSelected ? 1 : 0)
  }, [path.strokeWidth, isSelected])

  const strokeColor = useMemo(() => {
    // Always use the original stroke color
    return path.stroke ?? '#000000'
  }, [path.stroke])

  const opacity = useMemo(() => {
    // If no path is selected, all paths are fully opaque
    // If a path is selected, only the selected one is fully opaque
    if (!hasSelection) return 1
    return isSelected ? 1 : 0.3
  }, [isSelected, hasSelection])

  const handlePathClick = useCallback((event: React.MouseEvent) => {
    if (tool !== 'select') return
    
    event.preventDefault()
    event.stopPropagation()
    
    // Toggle selection: if already selected, deselect; if not selected, select
    if (isSelected) {
      setSelectedPath(undefined)
    } else {
      setSelectedPath(path.id)
    }
  }, [tool, isSelected, path.id, setSelectedPath])

  return (
    <g>
      {/* Main path */}
      <path
        d={pathString}
        fill={path.fill ?? 'none'}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        className={`transition-all duration-200 ${tool === 'select' ? 'cursor-pointer' : ''}`}
        onClick={handlePathClick}
      />
      
      {/* Selection highlight */}
      {isSelected && (
        <path
          d={pathString}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth + 2}
          strokeOpacity="0.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none"
        />
      )}
      
      {/* Path points for editing */}
      {isSelected && <PathPoints path={path} screenToSVG={screenToSVG} />}
    </g>
  )
}

interface ControlPointProps {
  point: {
    x: number; 
    y: number; 
    index: number; 
    type: 'point' | 'control'; 
    commandIndex: number;
    pointType: 'start' | 'end' | 'control1' | 'control2';
  }
  isSelected: boolean
  onMouseDown: (event: React.MouseEvent, pointIndex: number, commandIndex: number, pointType: 'start' | 'end' | 'control1' | 'control2') => void
}

const ControlPoint = memo(({ point, isSelected, onMouseDown }: ControlPointProps) => {
  const isControlPoint = point.type === 'control'
  
  return (
    <circle
      cx={point.x}
      cy={point.y}
      r={isControlPoint ? 3 : 4}
      fill={isSelected ? '#0066ff' : '#ffffff'}
      stroke={isControlPoint ? '#0066ff' : '#0066ff'}
      strokeWidth="2"
      className="cursor-pointer select-none"
      style={{ 
        opacity: isControlPoint ? 0.7 : 1,
        strokeDasharray: isControlPoint ? '2,2' : 'none'
      }}
      onMouseDown={(e) => onMouseDown(e, point.index, point.commandIndex, point.pointType)}
    />
  )
})

interface PathPointsProps {
  path: SVGPath
  screenToSVG?: (screenX: number, screenY: number) => SVGPoint
}

function PathPoints({ path, screenToSVG }: PathPointsProps) {
  const { selectedPoints, updatePath } = useEditorStore()
  const isDragging = useRef(false)
  const dragPointIndex = useRef<number>(-1)
  const dragCommandIndex = useRef<number>(-1)
  const dragPointType = useRef<'start' | 'end' | 'control1' | 'control2'>('end')
  const lastGridPoint = useRef<SVGPoint>({ x: 0, y: 0 })
  const updatePending = useRef(false)
  
  const BASE_GRID_SIZE = 20

  const convertScreenToGrid = useCallback((screenX: number, screenY: number): SVGPoint => {
    if (!screenToSVG) return { x: 0, y: 0 }
    
    // First convert screen coordinates to SVG coordinates (handles zoom/pan)
    const svgPoint = screenToSVG(screenX, screenY)
    
    // Then convert SVG pixel coordinates to grid coordinates with proper rounding
    const gridX = Math.round(svgPoint.x / BASE_GRID_SIZE)
    const gridY = Math.round(svgPoint.y / BASE_GRID_SIZE)
    
    return { x: gridX, y: gridY }
  }, [screenToSVG])

  const updatePathCommand = useCallback((commandIndex: number, pointType: string, gridPoint: SVGPoint) => {
    const updatedCommands = [...path.commands]
    const command = { ...updatedCommands[commandIndex] }
    
    switch (command.type) {
      case 'M':
      case 'L':
        command.points = [gridPoint.x, gridPoint.y]
        break
      case 'C':
        if (pointType === 'control1') {
          command.points = [gridPoint.x, gridPoint.y, command.points[2], command.points[3], command.points[4], command.points[5]]
        } else if (pointType === 'control2') {
          command.points = [command.points[0], command.points[1], gridPoint.x, gridPoint.y, command.points[4], command.points[5]]
        } else if (pointType === 'end') {
          command.points = [command.points[0], command.points[1], command.points[2], command.points[3], gridPoint.x, gridPoint.y]
        }
        break
      case 'Q':
        if (pointType === 'control1') {
          command.points = [gridPoint.x, gridPoint.y, command.points[2], command.points[3]]
        } else if (pointType === 'end') {
          command.points = [command.points[0], command.points[1], gridPoint.x, gridPoint.y]
        }
        break
    }
    
    updatedCommands[commandIndex] = command
    updatePath(path.id, { commands: updatedCommands })
  }, [path.commands, path.id, updatePath])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    dragPointIndex.current = -1
    dragCommandIndex.current = -1
  }, [])

  // Add global mouse event listeners only when dragging
  const addDragListeners = useCallback(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!isDragging.current || updatePending.current) return
      
      const gridPoint = convertScreenToGrid(event.clientX, event.clientY)
      
      // Only update if the grid coordinate has actually changed
      if (gridPoint.x !== lastGridPoint.current.x || gridPoint.y !== lastGridPoint.current.y) {
        lastGridPoint.current = gridPoint
        updatePending.current = true
        
        requestAnimationFrame(() => {
          updatePathCommand(dragCommandIndex.current, dragPointType.current, gridPoint)
          updatePending.current = false
        })
      }
    }
    
    const handleGlobalMouseUp = () => {
      handleMouseUp()
      removeDragListeners()
    }

    const removeDragListeners = () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    
    return removeDragListeners
  }, [convertScreenToGrid, updatePathCommand, handleMouseUp])

  const handleMouseDown = useCallback((event: React.MouseEvent, pointIndex: number, commandIndex: number, pointType: 'start' | 'end' | 'control1' | 'control2') => {
    event.preventDefault()
    event.stopPropagation()
    isDragging.current = true
    dragPointIndex.current = pointIndex
    dragCommandIndex.current = commandIndex
    dragPointType.current = pointType
    
    // Store initial grid position to prevent unnecessary updates
    const initialGridPoint = convertScreenToGrid(event.clientX, event.clientY)
    lastGridPoint.current = initialGridPoint
    
    // Start listening for drag events
    addDragListeners()
  }, [convertScreenToGrid, addDragListeners])
  
  const points = useMemo(() => {
    const BASE_GRID_SIZE = 20
    const allPoints: { 
      x: number; 
      y: number; 
      index: number; 
      type: 'point' | 'control'; 
      commandIndex: number;
      pointType: 'start' | 'end' | 'control1' | 'control2';
    }[] = []
    let currentX = 0
    let currentY = 0
    
    path.commands.forEach((cmd, cmdIndex) => {
      switch (cmd.type) {
        case 'M':
          currentX = cmd.relative ? currentX + cmd.points[0] : cmd.points[0]
          currentY = cmd.relative ? currentY + cmd.points[1] : cmd.points[1]
          allPoints.push({ 
            x: currentX * BASE_GRID_SIZE, 
            y: currentY * BASE_GRID_SIZE, 
            index: allPoints.length, 
            type: 'point',
            commandIndex: cmdIndex,
            pointType: 'start'
          })
          break
          
        case 'L':
          currentX = cmd.relative ? currentX + cmd.points[0] : cmd.points[0]
          currentY = cmd.relative ? currentY + cmd.points[1] : cmd.points[1]
          allPoints.push({ 
            x: currentX * BASE_GRID_SIZE, 
            y: currentY * BASE_GRID_SIZE, 
            index: allPoints.length, 
            type: 'point',
            commandIndex: cmdIndex,
            pointType: 'end'
          })
          break
          
        case 'C':
          // Control points
          const cp1x = cmd.relative ? currentX + cmd.points[0] : cmd.points[0]
          const cp1y = cmd.relative ? currentY + cmd.points[1] : cmd.points[1]
          const cp2x = cmd.relative ? currentX + cmd.points[2] : cmd.points[2]
          const cp2y = cmd.relative ? currentY + cmd.points[3] : cmd.points[3]
          
          allPoints.push({ 
            x: cp1x * BASE_GRID_SIZE, 
            y: cp1y * BASE_GRID_SIZE, 
            index: allPoints.length, 
            type: 'control',
            commandIndex: cmdIndex,
            pointType: 'control1'
          })
          allPoints.push({ 
            x: cp2x * BASE_GRID_SIZE, 
            y: cp2y * BASE_GRID_SIZE, 
            index: allPoints.length, 
            type: 'control',
            commandIndex: cmdIndex,
            pointType: 'control2'
          })
          
          // End point
          currentX = cmd.relative ? currentX + cmd.points[4] : cmd.points[4]
          currentY = cmd.relative ? currentY + cmd.points[5] : cmd.points[5]
          allPoints.push({ 
            x: currentX * BASE_GRID_SIZE, 
            y: currentY * BASE_GRID_SIZE, 
            index: allPoints.length, 
            type: 'point',
            commandIndex: cmdIndex,
            pointType: 'end'
          })
          break
          
        case 'Q':
          // Control point
          const cpx = cmd.relative ? currentX + cmd.points[0] : cmd.points[0]
          const cpy = cmd.relative ? currentY + cmd.points[1] : cmd.points[1]
          allPoints.push({ 
            x: cpx * BASE_GRID_SIZE, 
            y: cpy * BASE_GRID_SIZE, 
            index: allPoints.length, 
            type: 'control',
            commandIndex: cmdIndex,
            pointType: 'control1'
          })
          
          // End point
          currentX = cmd.relative ? currentX + cmd.points[2] : cmd.points[2]
          currentY = cmd.relative ? currentY + cmd.points[3] : cmd.points[3]
          allPoints.push({ 
            x: currentX * BASE_GRID_SIZE, 
            y: currentY * BASE_GRID_SIZE, 
            index: allPoints.length, 
            type: 'point',
            commandIndex: cmdIndex,
            pointType: 'end'
          })
          break
      }
    })
    
    return allPoints
  }, [path.commands])

  return (
    <g className="path-points">
      {points.map((point, index) => (
        <ControlPoint
          key={`${point.commandIndex}-${point.pointType}`}
          point={point}
          isSelected={selectedPoints.includes(index)}
          onMouseDown={handleMouseDown}
        />
      ))}
      
      {/* Control point lines for bezier curves */}
      {points
        .filter(point => point.type === 'control')
        .map((controlPoint, index) => {
          // Find the corresponding main point for this control point
          const mainPoint = points.find(p => 
            p.type === 'point' && 
            Math.abs(p.index - controlPoint.index) <= 1
          )
          
          if (!mainPoint) return null
          
          return (
            <line
              key={`control-line-${index}`}
              x1={controlPoint.x}
              y1={controlPoint.y}
              x2={mainPoint.x}
              y2={mainPoint.y}
              stroke="#0066ff"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.5"
              className="pointer-events-none"
            />
          )
        })}
    </g>
  )
}