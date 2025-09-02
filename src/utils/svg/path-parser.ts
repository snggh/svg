import type { SVGPathCommand } from '@/types'

/**
 * Parse an SVG path string into command objects
 */
export function parsePathString(pathString: string): SVGPathCommand[] {
  const commands: SVGPathCommand[] = []

  // Remove whitespace and normalize separators
  const cleaned = pathString.trim().replace(/,/g, ' ').replace(/\s+/g, ' ')

  // Match command letters and their parameters
  const matches = cleaned.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || []

  for (const match of matches) {
    const type = match[0].toUpperCase() as SVGPathCommand['type']
    const relative = match[0] === match[0].toLowerCase()
    const paramString = match.slice(1).trim()

    if (paramString === '' && type === 'Z') {
      // Close path command has no parameters
      commands.push({ type, points: [], relative })
      continue
    }

    const points = paramString
      .split(' ')
      .filter(p => p !== '')
      .map(Number)
      .filter(n => !isNaN(n))

    commands.push({ type, points, relative })
  }

  return commands
}

/**
 * Convert command objects back to SVG path string
 */
export function commandsToPathString(commands: SVGPathCommand[]): string {
  return commands
    .map(cmd => {
      const letter = cmd.relative ? cmd.type.toLowerCase() : cmd.type
      const points = cmd.points.join(' ')
      return `${letter}${points ? ' ' + points : ''}`
    })
    .join(' ')
    .trim()
}

const BASE_GRID_SIZE = 20

/**
 * Convert grid-based commands to pixel-based path string for rendering
 */
export function commandsToPixelPathString(commands: SVGPathCommand[]): string {
  return commands
    .map(cmd => {
      const letter = cmd.relative ? cmd.type.toLowerCase() : cmd.type
      // Convert grid coordinates to pixel coordinates
      // Special handling for Arc (A) command flags
      const pixelPoints = cmd.points.map((point, index) => {
        // For Arc commands, large-arc and sweep flags should not be scaled
        if (cmd.type === 'A' && (index === 3 || index === 4)) {
          return point
        }
        return point * BASE_GRID_SIZE
      })
      const points = pixelPoints.join(' ')
      return `${letter}${points ? ' ' + points : ''}`
    })
    .join(' ')
    .trim()
}

/**
 * Convert relative commands to absolute
 */
export function toAbsolute(commands: SVGPathCommand[]): SVGPathCommand[] {
  const result: SVGPathCommand[] = []
  let currentPoint = { x: 0, y: 0 }
  let startPoint = { x: 0, y: 0 }

  for (const cmd of commands) {
    if (!cmd.relative) {
      result.push(cmd)
      updateCurrentPoint(cmd, currentPoint, startPoint)
      continue
    }

    const absoluteCmd: SVGPathCommand = {
      type: cmd.type,
      points: [...cmd.points],
      relative: false,
    }

    switch (cmd.type) {
      case 'M':
        absoluteCmd.points[0] += currentPoint.x
        absoluteCmd.points[1] += currentPoint.y
        break
      case 'L':
        absoluteCmd.points[0] += currentPoint.x
        absoluteCmd.points[1] += currentPoint.y
        break
      case 'H':
        absoluteCmd.points[0] += currentPoint.x
        break
      case 'V':
        absoluteCmd.points[0] += currentPoint.y
        break
      case 'C':
        for (let i = 0; i < absoluteCmd.points.length; i += 2) {
          absoluteCmd.points[i] += currentPoint.x
          absoluteCmd.points[i + 1] += currentPoint.y
        }
        break
      case 'Q':
        absoluteCmd.points[0] += currentPoint.x
        absoluteCmd.points[1] += currentPoint.y
        absoluteCmd.points[2] += currentPoint.x
        absoluteCmd.points[3] += currentPoint.y
        break
      case 'A':
        // For Arc commands, only the end point (x,y) needs to be made absolute
        // rx, ry, rotation, large-arc-flag, sweep-flag stay the same
        absoluteCmd.points[5] += currentPoint.x // x
        absoluteCmd.points[6] += currentPoint.y // y
        break
    }

    result.push(absoluteCmd)
    updateCurrentPoint(absoluteCmd, currentPoint, startPoint)
  }

  return result
}

/**
 * Convert absolute commands to relative
 */
export function toRelative(commands: SVGPathCommand[]): SVGPathCommand[] {
  const result: SVGPathCommand[] = []
  let currentPoint = { x: 0, y: 0 }
  let startPoint = { x: 0, y: 0 }

  for (const cmd of commands) {
    if (cmd.relative) {
      result.push(cmd)
      updateCurrentPoint(cmd, currentPoint, startPoint)
      continue
    }

    const relativeCmd: SVGPathCommand = {
      type: cmd.type,
      points: [...cmd.points],
      relative: true,
    }

    switch (cmd.type) {
      case 'M':
        if (result.length === 0) {
          // First M command stays absolute
          relativeCmd.relative = false
        } else {
          relativeCmd.points[0] -= currentPoint.x
          relativeCmd.points[1] -= currentPoint.y
        }
        break
      case 'L':
        relativeCmd.points[0] -= currentPoint.x
        relativeCmd.points[1] -= currentPoint.y
        break
      case 'H':
        relativeCmd.points[0] -= currentPoint.x
        break
      case 'V':
        relativeCmd.points[0] -= currentPoint.y
        break
      case 'C':
        for (let i = 0; i < relativeCmd.points.length; i += 2) {
          relativeCmd.points[i] -= currentPoint.x
          relativeCmd.points[i + 1] -= currentPoint.y
        }
        break
      case 'Q':
        relativeCmd.points[0] -= currentPoint.x
        relativeCmd.points[1] -= currentPoint.y
        relativeCmd.points[2] -= currentPoint.x
        relativeCmd.points[3] -= currentPoint.y
        break
      case 'A':
        // For Arc commands, only the end point (x,y) needs to be made relative
        // rx, ry, rotation, large-arc-flag, sweep-flag stay the same
        relativeCmd.points[5] -= currentPoint.x // x
        relativeCmd.points[6] -= currentPoint.y // y
        break
    }

    result.push(relativeCmd)
    updateCurrentPoint(cmd, currentPoint, startPoint)
  }

  return result
}

function updateCurrentPoint(
  cmd: SVGPathCommand,
  currentPoint: { x: number; y: number },
  startPoint: { x: number; y: number }
) {
  switch (cmd.type) {
    case 'M':
      currentPoint.x = cmd.points[0]
      currentPoint.y = cmd.points[1]
      startPoint.x = currentPoint.x
      startPoint.y = currentPoint.y
      break
    case 'L':
      currentPoint.x = cmd.points[0]
      currentPoint.y = cmd.points[1]
      break
    case 'H':
      currentPoint.x = cmd.points[0]
      break
    case 'V':
      currentPoint.y = cmd.points[0]
      break
    case 'C':
      currentPoint.x = cmd.points[4]
      currentPoint.y = cmd.points[5]
      break
    case 'Q':
      currentPoint.x = cmd.points[2]
      currentPoint.y = cmd.points[3]
      break
    case 'A':
      currentPoint.x = cmd.points[5]
      currentPoint.y = cmd.points[6]
      break
    case 'Z':
      currentPoint.x = startPoint.x
      currentPoint.y = startPoint.y
      break
  }
}
