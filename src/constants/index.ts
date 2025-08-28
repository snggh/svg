// SVG path command constants
export const SVG_COMMANDS = {
  MOVE_TO: 'M',
  LINE_TO: 'L',
  HORIZONTAL_LINE_TO: 'H',
  VERTICAL_LINE_TO: 'V',
  CURVE_TO: 'C',
  SMOOTH_CURVE_TO: 'S',
  QUADRATIC_BEZIER_CURVE_TO: 'Q',
  SMOOTH_QUADRATIC_BEZIER_CURVE_TO: 'T',
  ELLIPTICAL_ARC: 'A',
  CLOSE_PATH: 'Z',
} as const

// Editor constants
export const EDITOR_CONFIG = {
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 10,
  ZOOM_STEP: 0.1,
  GRID_SIZE: 10,
  SNAP_DISTANCE: 5,
  DEFAULT_STROKE_WIDTH: 2,
  SELECTION_RADIUS: 5,
} as const

// Export formats
export const EXPORT_FORMATS = {
  SVG: 'svg',
  PNG: 'png',
  REACT: 'react',
} as const

// Supported image formats for reference images
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
] as const
