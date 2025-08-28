import { useCallback, useRef, useEffect } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import type { SVGPoint } from '@/types'

interface UseViewportOptions {
  containerRef: React.RefObject<HTMLDivElement | null>
}

interface ViewportTransform {
  scale: number
  translateX: number
  translateY: number
}

export function useViewport({ containerRef }: UseViewportOptions) {
  const { zoom, pan, setZoom, setPan } = useEditorStore()
  const isPanning = useRef(false)
  const lastPanPoint = useRef<SVGPoint>({ x: 0, y: 0 })
  const isSpacePressed = useRef(false)

  const getViewportTransform = useCallback((): ViewportTransform => ({
    scale: zoom,
    translateX: pan.x,
    translateY: pan.y,
  }), [zoom, pan.x, pan.y])

  const screenToSVG = useCallback((screenX: number, screenY: number): SVGPoint => {
    if (!containerRef.current) return { x: screenX, y: screenY }
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = (screenX - rect.left - pan.x) / zoom
    const y = (screenY - rect.top - pan.y) / zoom
    
    return { x, y }
  }, [zoom, pan.x, pan.y])

  const svgToScreen = useCallback((svgX: number, svgY: number): SVGPoint => {
    const x = svgX * zoom + pan.x
    const y = svgY * zoom + pan.y
    
    return { x, y }
  }, [zoom, pan.x, pan.y])

  const handleWheelZoom = useCallback((event: WheelEvent) => {
    event.preventDefault()
    
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    
    // Convert mouse position to SVG coordinates before zoom
    const svgPoint = screenToSVG(event.clientX, event.clientY)
    
    // Calculate new zoom level
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9
    const newZoom = Math.max(0.1, Math.min(10, zoom * zoomFactor))
    
    // Calculate new pan to keep mouse position fixed
    const newPan = {
      x: mouseX - svgPoint.x * newZoom,
      y: mouseY - svgPoint.y * newZoom,
    }
    
    setZoom(newZoom)
    setPan(newPan)
  }, [zoom, pan, screenToSVG, setZoom, setPan])

  const handlePanStart = useCallback((event: React.MouseEvent) => {
    isPanning.current = true
    lastPanPoint.current = { x: event.clientX, y: event.clientY }
  }, [])

  const handlePanMove = useCallback((event: React.MouseEvent) => {
    if (!isPanning.current) return
    
    const deltaX = event.clientX - lastPanPoint.current.x
    const deltaY = event.clientY - lastPanPoint.current.y
    
    setPan({
      x: pan.x + deltaX,
      y: pan.y + deltaY,
    })
    
    lastPanPoint.current = { x: event.clientX, y: event.clientY }
  }, [pan, setPan])

  const handlePanEnd = useCallback(() => {
    isPanning.current = false
  }, [])

  const fitToContent = useCallback(() => {
    // Reset to default view
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [setZoom, setPan])

  // Handle space key for panning
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault()
        isSpacePressed.current = true
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        isSpacePressed.current = false
        if (isPanning.current) {
          isPanning.current = false
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return {
    // Transform data
    transform: getViewportTransform(),
    zoom,
    pan,
    
    // Coordinate conversion
    screenToSVG,
    svgToScreen,
    
    // Event handlers
    handleWheelZoom,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    
    // Utilities
    fitToContent,
    isPanning: isPanning.current,
    isSpacePressed: isSpacePressed.current,
  }
}