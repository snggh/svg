import { useCallback, useRef } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import type { SVGPoint, SVGPath, SVGPathCommand } from '@/types'

interface UseDrawingOptions {
  screenToSVG: (screenX: number, screenY: number) => SVGPoint
}

export function useDrawing({ screenToSVG }: UseDrawingOptions) {
  const { tool, addPath, updatePath } = useEditorStore()
  const currentPath = useRef<SVGPath | null>(null)
  const isDrawing = useRef(false)

  const startPath = useCallback((point: SVGPoint) => {
    if (tool !== 'pen') return

    const newPath: SVGPath = {
      id: `path-${Date.now()}`,
      commands: [
        {
          type: 'M',
          points: [point.x, point.y],
          relative: false,
        }
      ],
      fill: 'none',
      stroke: 'hsl(var(--foreground))',
      strokeWidth: 2,
    }

    currentPath.current = newPath
    isDrawing.current = true
    addPath(newPath)
  }, [tool, addPath])

  const continueDrawing = useCallback((point: SVGPoint) => {
    if (!isDrawing.current || !currentPath.current || tool !== 'pen') return

    const newCommand: SVGPathCommand = {
      type: 'L',
      points: [point.x, point.y],
      relative: false,
    }

    const updatedCommands = [...currentPath.current.commands, newCommand]
    currentPath.current.commands = updatedCommands

    updatePath(currentPath.current.id, { commands: updatedCommands })
  }, [tool, updatePath])

  const endDrawing = useCallback(() => {
    if (!isDrawing.current || !currentPath.current) return

    isDrawing.current = false
    currentPath.current = null
  }, [])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (tool !== 'pen') return

    event.preventDefault()
    const svgPoint = screenToSVG(event.clientX, event.clientY)
    
    if (!isDrawing.current) {
      startPath(svgPoint)
    } else {
      // Continue current path
      continueDrawing(svgPoint)
    }
  }, [tool, screenToSVG, startPath, continueDrawing])

  const handleMouseMove = useCallback((_event: React.MouseEvent) => {
    if (!isDrawing.current || !currentPath.current || tool !== 'pen') return

    // Show preview line (this would be implemented in a preview component)
    // For now, we'll just update the path continuously for smooth drawing
  }, [tool])

  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    if (tool !== 'pen' || !isDrawing.current) return
    
    event.preventDefault()
    endDrawing()
  }, [tool, endDrawing])

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isDrawing.current) {
      endDrawing()
    } else if (event.key === 'Enter' && isDrawing.current) {
      endDrawing()
    }
  }, [endDrawing])

  return {
    isDrawing: isDrawing.current,
    currentPath: currentPath.current,
    handleMouseDown,
    handleMouseMove, 
    handleDoubleClick,
    handleKeyPress,
    startPath,
    continueDrawing,
    endDrawing,
  }
}