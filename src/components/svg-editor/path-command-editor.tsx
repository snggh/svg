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
                  <span className="text-xs font-mono font-bold w-6 text-center bg-primary text-primary-foreground rounded">
                    {displayName}
                  </span>
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