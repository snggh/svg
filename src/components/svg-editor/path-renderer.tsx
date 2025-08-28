import { useMemo } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { commandsToPathString } from '@/utils/svg/path-parser'
import type { SVGPath } from '@/types'

interface PathRendererProps {
  className?: string
}

export function PathRenderer({ className }: PathRendererProps) {
  const { paths, selectedPath } = useEditorStore()

  return (
    <g className={className}>
      {paths.map(path => (
        <PathElement
          key={path.id}
          path={path}
          isSelected={path.id === selectedPath}
        />
      ))}
    </g>
  )
}

interface PathElementProps {
  path: SVGPath
  isSelected: boolean
}

function PathElement({ path, isSelected }: PathElementProps) {
  const pathString = useMemo(() => {
    return commandsToPathString(path.commands)
  }, [path.commands])

  const strokeWidth = useMemo(() => {
    return (path.strokeWidth ?? 2) + (isSelected ? 1 : 0)
  }, [path.strokeWidth, isSelected])

  const strokeColor = useMemo(() => {
    if (isSelected) return 'hsl(var(--primary))'
    return path.stroke ?? 'hsl(var(--foreground))'
  }, [path.stroke, isSelected])

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
        className="transition-all duration-200"
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
      {isSelected && <PathPoints path={path} />}
    </g>
  )
}

interface PathPointsProps {
  path: SVGPath
}

function PathPoints({ path }: PathPointsProps) {
  const { selectedPoints } = useEditorStore()
  
  const points = useMemo(() => {
    const allPoints: { x: number; y: number; index: number; type: 'point' | 'control' }[] = []
    let currentX = 0
    let currentY = 0
    
    path.commands.forEach((cmd, cmdIndex) => {
      switch (cmd.type) {
        case 'M':
          currentX = cmd.relative ? currentX + cmd.points[0] : cmd.points[0]
          currentY = cmd.relative ? currentY + cmd.points[1] : cmd.points[1]
          allPoints.push({ x: currentX, y: currentY, index: cmdIndex, type: 'point' })
          break
          
        case 'L':
          currentX = cmd.relative ? currentX + cmd.points[0] : cmd.points[0]
          currentY = cmd.relative ? currentY + cmd.points[1] : cmd.points[1]
          allPoints.push({ x: currentX, y: currentY, index: cmdIndex, type: 'point' })
          break
          
        case 'C':
          // Control points
          const cp1x = cmd.relative ? currentX + cmd.points[0] : cmd.points[0]
          const cp1y = cmd.relative ? currentY + cmd.points[1] : cmd.points[1]
          const cp2x = cmd.relative ? currentX + cmd.points[2] : cmd.points[2]
          const cp2y = cmd.relative ? currentY + cmd.points[3] : cmd.points[3]
          
          allPoints.push({ x: cp1x, y: cp1y, index: cmdIndex, type: 'control' })
          allPoints.push({ x: cp2x, y: cp2y, index: cmdIndex, type: 'control' })
          
          // End point
          currentX = cmd.relative ? currentX + cmd.points[4] : cmd.points[4]
          currentY = cmd.relative ? currentY + cmd.points[5] : cmd.points[5]
          allPoints.push({ x: currentX, y: currentY, index: cmdIndex, type: 'point' })
          break
          
        case 'Q':
          // Control point
          const cpx = cmd.relative ? currentX + cmd.points[0] : cmd.points[0]
          const cpy = cmd.relative ? currentY + cmd.points[1] : cmd.points[1]
          allPoints.push({ x: cpx, y: cpy, index: cmdIndex, type: 'control' })
          
          // End point
          currentX = cmd.relative ? currentX + cmd.points[2] : cmd.points[2]
          currentY = cmd.relative ? currentY + cmd.points[3] : cmd.points[3]
          allPoints.push({ x: currentX, y: currentY, index: cmdIndex, type: 'point' })
          break
      }
    })
    
    return allPoints
  }, [path.commands])

  return (
    <g className="path-points">
      {points.map((point, index) => {
        const isSelected = selectedPoints.includes(index)
        const isControlPoint = point.type === 'control'
        
        return (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={isControlPoint ? 3 : 4}
            fill={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--background))'}
            stroke={isControlPoint ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary))'}
            strokeWidth="2"
            className="cursor-pointer hover:scale-110 transition-transform"
            style={{ 
              opacity: isControlPoint ? 0.7 : 1,
              strokeDasharray: isControlPoint ? '2,2' : 'none'
            }}
          />
        )
      })}
      
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
              stroke="hsl(var(--muted-foreground))"
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