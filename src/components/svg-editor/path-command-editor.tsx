import { useState } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Tooltip } from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { SVGPathCommand } from '@/types'

export function PathCommandEditor() {
  const { paths, selectedPath, updatePath } = useEditorStore()
  const [isExpanded, setIsExpanded] = useState(true)
  
  const currentPath = paths.find(p => p.id === selectedPath)
  
  if (!currentPath || !selectedPath) {
    return null
  }

  const handleCommandChange = (commandIndex: number, pointIndex: number, value: string) => {
    const numValue = parseFloat(value) || 0
    const updatedCommands = [...currentPath.commands]
    const command = { ...updatedCommands[commandIndex] }
    command.points = [...command.points]
    command.points[pointIndex] = numValue
    updatedCommands[commandIndex] = command
    
    updatePath(selectedPath, { commands: updatedCommands })
  }

  const handleCheckboxChange = (commandIndex: number, pointIndex: number, checked: boolean) => {
    const updatedCommands = [...currentPath.commands]
    const command = { ...updatedCommands[commandIndex] }
    command.points = [...command.points]
    command.points[pointIndex] = checked ? 1 : 0
    updatedCommands[commandIndex] = command
    
    updatePath(selectedPath, { commands: updatedCommands })
  }

  const handleCommandTypeChange = (commandIndex: number, newType: SVGPathCommand['type']) => {
    const updatedCommands = [...currentPath.commands]
    const currentCommand = updatedCommands[commandIndex]
    
    // Create new command with converted parameters
    const newCommand: SVGPathCommand = {
      type: newType,
      relative: currentCommand.relative,
      points: convertCommandParameters(currentCommand, newType)
    }
    
    updatedCommands[commandIndex] = newCommand
    updatePath(selectedPath, { commands: updatedCommands })
  }

  const convertCommandParameters = (oldCommand: SVGPathCommand, newType: SVGPathCommand['type']): number[] => {
    const oldPoints = oldCommand.points
    
    // Extract end coordinates from the old command
    const getEndCoordinates = (cmd: SVGPathCommand): { x: number, y: number } => {
      switch (cmd.type) {
        case 'M': case 'L': case 'T': 
          return { x: cmd.points[0] || 0, y: cmd.points[1] || 0 }
        case 'H': 
          return { x: cmd.points[0] || 0, y: 0 }
        case 'V': 
          return { x: 0, y: cmd.points[0] || 0 }
        case 'C': 
          return { x: cmd.points[4] || 0, y: cmd.points[5] || 0 }
        case 'S': case 'Q': 
          return { x: cmd.points[2] || 0, y: cmd.points[3] || 0 }
        case 'A': 
          return { x: cmd.points[5] || 0, y: cmd.points[6] || 0 }
        case 'Z': 
        default: 
          return { x: 0, y: 0 }
      }
    }
    
    // Create default parameters for each command type, preserving end coordinates
    const createDefaultParameters = (type: SVGPathCommand['type'], endX: number, endY: number): number[] => {
      switch (type) {
        case 'M': case 'L': case 'T': 
          return [endX, endY]
        case 'H': 
          return [endX]
        case 'V': 
          return [endY]
        case 'C': 
          return [0, 0, 0, 0, endX, endY] // Default control points to (0,0)
        case 'S': case 'Q': 
          return [0, 0, endX, endY] // Default control point to (0,0)
        case 'A': 
          return [20, 20, 0, 0, 0, endX, endY] // Default rx=20, ry=20, rotation=0, flags=0
        case 'Z': 
        default: 
          return []
      }
    }
    
    if (newType === 'Z') {
      return []
    }
    
    // Get end coordinates from old command
    const endCoords = getEndCoordinates(oldCommand)
    
    // Create default parameters with preserved end coordinates
    const newPoints = createDefaultParameters(newType, endCoords.x, endCoords.y)
    
    // Try to preserve some meaningful parameters from the old command if they make sense
    if (oldCommand.type === newType) {
      // Same command type, just return the original points
      return [...oldPoints]
    } else {
      // Different command types - intelligently copy compatible parameters
      switch (newType) {
        case 'C':
          // For cubic curves, try to use some old points as control points if available
          if (oldPoints.length >= 2) {
            newPoints[0] = oldPoints[0] // x1
            newPoints[1] = oldPoints[1] // y1
          }
          if (oldPoints.length >= 4 && oldCommand.type !== 'A') {
            newPoints[2] = oldPoints[2] // x2
            newPoints[3] = oldPoints[3] // y2
          }
          break
        case 'S': case 'Q':
          // For smooth/quadratic curves, try to use old points as control point
          if (oldPoints.length >= 2) {
            newPoints[0] = oldPoints[0] // control point x
            newPoints[1] = oldPoints[1] // control point y  
          }
          break
        case 'A':
          // For arcs, try to preserve radii from old command if it makes sense
          if (oldCommand.type === 'A') {
            // Preserve all arc parameters
            for (let i = 0; i < Math.min(oldPoints.length, 7); i++) {
              newPoints[i] = oldPoints[i]
            }
          } else if (oldPoints.length >= 2) {
            // Use first two values as radii
            newPoints[0] = Math.abs(oldPoints[0]) || 20 // rx
            newPoints[1] = Math.abs(oldPoints[1]) || 20 // ry
          }
          // Ensure flags are 0 or 1
          newPoints[3] = newPoints[3] > 0 ? 1 : 0 // large-arc flag
          newPoints[4] = newPoints[4] > 0 ? 1 : 0 // sweep flag
          break
      }
    }
    
    return newPoints
  }


  const getParameterInfo = (command: SVGPathCommand): Array<{label: string, description: string}> => {
    switch (command.type) {
      case 'M':
        return [
          { label: 'x', description: 'X coordinate to move to' },
          { label: 'y', description: 'Y coordinate to move to' }
        ]
      case 'L':
        return [
          { label: 'x', description: 'X coordinate of line end point' },
          { label: 'y', description: 'Y coordinate of line end point' }
        ]
      case 'H':
        return [{ label: 'x', description: 'X coordinate for horizontal line' }]
      case 'V':
        return [{ label: 'y', description: 'Y coordinate for vertical line' }]
      case 'C':
        return [
          { label: 'x1', description: 'X coordinate of first control point' },
          { label: 'y1', description: 'Y coordinate of first control point' },
          { label: 'x2', description: 'X coordinate of second control point' },
          { label: 'y2', description: 'Y coordinate of second control point' },
          { label: 'x', description: 'X coordinate of end point' },
          { label: 'y', description: 'Y coordinate of end point' }
        ]
      case 'S':
        return [
          { label: 'x2', description: 'X coordinate of second control point' },
          { label: 'y2', description: 'Y coordinate of second control point' },
          { label: 'x', description: 'X coordinate of end point' },
          { label: 'y', description: 'Y coordinate of end point' }
        ]
      case 'Q':
        return [
          { label: 'x1', description: 'X coordinate of control point' },
          { label: 'y1', description: 'Y coordinate of control point' },
          { label: 'x', description: 'X coordinate of end point' },
          { label: 'y', description: 'Y coordinate of end point' }
        ]
      case 'T':
        return [
          { label: 'x', description: 'X coordinate of end point' },
          { label: 'y', description: 'Y coordinate of end point' }
        ]
      case 'A':
        return [
          { label: 'rx', description: 'X radius of ellipse' },
          { label: 'ry', description: 'Y radius of ellipse' },
          { label: 'rotation', description: 'Rotation angle in degrees' },
          { label: 'large-arc', description: 'Large arc flag (0 or 1)' },
          { label: 'sweep', description: 'Sweep direction flag (0 or 1)' },
          { label: 'x', description: 'X coordinate of end point' },
          { label: 'y', description: 'Y coordinate of end point' }
        ]
      case 'Z':
        return []
      default:
        return command.points.map((_, i) => ({ 
          label: `p${i}`, 
          description: `Parameter ${i + 1}` 
        }))
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start p-2 h-auto"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
        <span className="text-sm font-medium">Commands</span>
      </Button>
      
      {isExpanded && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {currentPath.commands.map((command, commandIndex) => {
            const parameterInfo = getParameterInfo(command)
            
            return (
              <Card key={commandIndex} className="p-3">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Command Type */}
                    <Select
                      value={command.type}
                      onChange={(e) => handleCommandTypeChange(commandIndex, e.target.value as SVGPathCommand['type'])}
                      className="w-12 h-8"
                    >
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="H">H</option>
                      <option value="V">V</option>
                      <option value="C">C</option>
                      <option value="S">S</option>
                      <option value="Q">Q</option>
                      <option value="T">T</option>
                      <option value="A">A</option>
                      <option value="Z">Z</option>
                    </Select>

                    {/* Relative Toggle */}
                    <Label className="flex items-center gap-1">
                      <Checkbox
                        checked={command.relative}
                        onChange={(e) => {
                          const updatedCommands = [...currentPath.commands]
                          updatedCommands[commandIndex] = { ...command, relative: e.target.checked }
                          updatePath(selectedPath, { commands: updatedCommands })
                        }}
                      />
                      <span className="text-xs">rel</span>
                    </Label>

                    {/* Parameter Inputs */}
                    {command.points.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {command.points.map((point, pointIndex) => {
                          // For Arc (A) command, large-arc and sweep should be checkboxes
                          const isArcFlag = command.type === 'A' && (pointIndex === 3 || pointIndex === 4)
                          
                          return (
                            <Tooltip 
                              key={pointIndex}
                              content={parameterInfo[pointIndex]?.description || `Parameter ${pointIndex + 1}`}
                            >
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground font-mono">
                                  {parameterInfo[pointIndex]?.label || `p${pointIndex}`}:
                                </span>
                                {isArcFlag ? (
                                  <Checkbox
                                    checked={point === 1}
                                    onChange={(e) => handleCheckboxChange(commandIndex, pointIndex, e.target.checked)}
                                  />
                                ) : (
                                  <Input
                                    type="number"
                                    value={point}
                                    onChange={(e) => handleCommandChange(commandIndex, pointIndex, e.target.value)}
                                    className="w-16 h-7 text-xs"
                                    step="any"
                                  />
                                )}
                              </div>
                            </Tooltip>
                          )
                        })}
                      </div>
                    )}
                    
                    {command.type === 'Z' && (
                      <span className="text-xs text-muted-foreground italic">
                        (closes path)
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}