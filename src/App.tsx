import { useEffect, useRef } from 'react'
import { SvgViewport, PathRenderer } from '@/components/svg-editor'
import { useEditorStore } from '@/stores/editor-store'
import { parsePathString } from '@/utils/svg/path-parser'
import { Button } from '@/components/ui/button'
import type { SVGPath } from '@/types'

function App() {
  const { zoom, tool, setTool, gridVisible, toggleGrid, resetView, addPath, paths, selectedPath, setSelectedPath } = useEditorStore()

  // Add demo paths on first load - use ref to prevent duplicate calls
  const hasInitialized = useRef(false)
  
  useEffect(() => {
    if (paths.length === 0 && !hasInitialized.current) {
      hasInitialized.current = true
      
      const demoPaths: SVGPath[] = [
        {
          id: 'demo-1',
          commands: parsePathString('M 100 100 L 200 100 L 150 150 Z'),
          fill: 'none',
          stroke: 'hsl(var(--primary))',
          strokeWidth: 2,
        },
        {
          id: 'demo-2', 
          commands: parsePathString('M 250 100 Q 300 50 350 100 T 450 100'),
          fill: 'none',
          stroke: 'hsl(var(--destructive))',
          strokeWidth: 3,
        },
        {
          id: 'demo-3',
          commands: parsePathString('M 500 100 C 520 80 580 80 600 100 S 660 120 680 100'),
          fill: 'none',
          stroke: 'hsl(var(--secondary-foreground))',
          strokeWidth: 2,
        },
      ]
      
      demoPaths.forEach(addPath)
    }
  }, [addPath, paths.length])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">SVG Path Editor</h1>
          
          {/* Quick controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleGrid}
            >
              Grid {gridVisible ? 'On' : 'Off'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
            >
              Reset View
            </Button>
            <span className="text-sm text-muted-foreground">
              Zoom: {Math.round(zoom * 100)}%
            </span>
          </div>
        </div>
      </header>

      {/* Main editor */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-muted/20 p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={tool === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('select')}
                >
                  Select
                </Button>
                <Button
                  variant={tool === 'pen' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('pen')}
                >
                  Pen
                </Button>
                <Button
                  variant={tool === 'bezier' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('bezier')}
                >
                  Bezier
                </Button>
                <Button
                  variant={tool === 'pan' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('pan')}
                >
                  Pan
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Paths</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {paths.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No paths yet</p>
                ) : (
                  paths.map(path => (
                    <button
                      key={path.id}
                      className={`w-full text-left px-2 py-1 rounded text-xs ${
                        selectedPath === path.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedPath(path.id === selectedPath ? undefined : path.id)}
                    >
                      {path.id}
                    </button>
                  ))
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Instructions</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Mouse wheel: Zoom in/out</li>
                <li>• Middle click + drag: Pan</li>
                <li>• Pan tool + drag: Pan</li>
                <li>• Pen tool + click: Start/continue path</li>
                <li>• Double-click: Finish drawing</li>
                <li>• Enter/Esc: Finish drawing</li>
                <li>• Grid toggle: Show/hide grid</li>
                <li>• Click path name: Select/deselect</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Canvas area */}
        <main className="flex-1 p-4 bg-gray-50">
          <div className="w-full h-full flex items-center justify-center">
            <SvgViewport 
              width={800}
              height={600}
              className="shadow-lg rounded-lg"
            >
              <PathRenderer />
            </SvgViewport>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
