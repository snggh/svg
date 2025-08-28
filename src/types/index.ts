// SVG Path types
export interface SVGPoint {
  x: number
  y: number
}

export interface SVGPathCommand {
  type: 'M' | 'L' | 'H' | 'V' | 'C' | 'S' | 'Q' | 'T' | 'A' | 'Z'
  points: number[]
  relative: boolean
}

export interface SVGPath {
  id: string
  commands: SVGPathCommand[]
  fill?: string
  stroke?: string
  strokeWidth?: number
}

// Editor state types
export interface EditorState {
  tool: 'select' | 'pen' | 'bezier' | 'pan' | 'zoom'
  selectedPath?: string
  selectedPoints: number[]
  zoom: number
  pan: SVGPoint
  gridVisible: boolean
  snapToGrid: boolean
}

// Reference image types
export interface ReferenceImage {
  id: string
  url: string
  name: string
  position: SVGPoint
  scale: number
  rotation: number
  opacity: number
  visible: boolean
}

// Export types
export interface ExportOptions {
  format: 'svg' | 'png' | 'react'
  optimization: boolean
  precision: number
  size?: {
    width: number
    height: number
  }
}

export interface ReactComponentOptions {
  componentName: string
  typescript: boolean
  props: {
    size?: boolean
    color?: boolean
    className?: boolean
  }
}
