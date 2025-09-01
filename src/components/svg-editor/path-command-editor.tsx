import { useState } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { Button } from '@/components/ui/button'
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
    
    // Get the expected number of parameters for the new command type
    const getParameterCount = (type: SVGPathCommand['type']): number => {
      switch (type) {
        case 'M': case 'L': case 'T': return 2
        case 'H': case 'V': return 1
        case 'S': case 'Q': return 4
        case 'C': return 6
        case 'A': return 7
        case 'Z': return 0
        default: return 2
      }
    }
    
    const targetCount = getParameterCount(newType)
    const currentCount = oldPoints.length
    
    if (targetCount === 0) {
      return []
    } else if (currentCount >= targetCount) {
      // Truncate if we have too many parameters
      return oldPoints.slice(0, targetCount)
    } else {
      // Pad with the last coordinate pair or zeros if we need more parameters
      const newPoints = [...oldPoints]
      while (newPoints.length < targetCount) {
        if (newPoints.length >= 2) {
          // Repeat the last coordinate pair
          newPoints.push(newPoints[newPoints.length - 2], newPoints[newPoints.length - 1])
        } else {
          // Add zeros
          newPoints.push(0)
        }
      }
      return newPoints.slice(0, targetCount)
    }
  }

  const getCommandDisplayName = (command: SVGPathCommand) => {
    return command.relative ? command.type.toLowerCase() : command.type
  }

  const getPointLabels = (command: SVGPathCommand): string[] => {
    switch (command.type) {
      case 'M':
      case 'L':
        return ['x', 'y']
      case 'H':
        return ['x']
      case 'V':
        return ['y']
      case 'C':
        return ['x1', 'y1', 'x2', 'y2', 'x', 'y']
      case 'S':
      case 'Q':
        return ['x1', 'y1', 'x', 'y']
      case 'T':
        return ['x', 'y']
      case 'A':
        return ['rx', 'ry', 'rotation', 'large-arc', 'sweep', 'x', 'y']
      case 'Z':
        return []
      default:
        return command.points.map((_, i) => `p${i}`)
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
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {currentPath.commands.map((command, commandIndex) => {
            const labels = getPointLabels(command)
            const displayName = getCommandDisplayName(command)
            
            return (
              <div key={commandIndex} className="bg-muted/50 rounded p-2 space-y-1">
                <div className="flex items-center gap-2">
                  <select
                    value={command.type}
                    onChange={(e) => handleCommandTypeChange(commandIndex, e.target.value as SVGPathCommand['type'])}
                    className="text-xs font-mono font-bold w-8 text-center bg-primary text-primary-foreground rounded border-none outline-none appearance-none cursor-pointer"
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
                  </select>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={command.relative}
                      onChange={(e) => {
                        const updatedCommands = [...currentPath.commands]
                        updatedCommands[commandIndex] = { ...command, relative: e.target.checked }
                        updatePath(selectedPath, { commands: updatedCommands })
                      }}
                      className="w-3 h-3"
                    />
                    <span className="text-xs text-muted-foreground">rel</span>
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {command.type === 'Z' ? 'Close Path' : `${command.points.length} values`}
                  </span>
                </div>
                
                {command.points.length > 0 && (
                  <div className="grid grid-cols-2 gap-1">
                    {command.points.map((point, pointIndex) => (
                      <div key={pointIndex} className="flex items-center gap-1">
                        <label className="text-xs text-muted-foreground w-8">
                          {labels[pointIndex] || `p${pointIndex}`}
                        </label>
                        <input
                          type="number"
                          value={point}
                          onChange={(e) => handleCommandChange(commandIndex, pointIndex, e.target.value)}
                          className="flex-1 h-6 px-1 text-xs border border-border rounded bg-background"
                          step="any"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}