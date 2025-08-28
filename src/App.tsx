import { useEffect, useRef } from 'react'
import { SvgViewport, PathRenderer } from '@/components/svg-editor'
import { PathCommandEditor } from '@/components/svg-editor/path-command-editor'
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
          commands: parsePathString('M 1 1 L 6 1 L 3 4 Z'),
          fill: 'none',
          stroke: '#000000',
          strokeWidth: 2,
        },
        {
          id: 'demo-2', 
          commands: parsePathString('M 8 2 Q 10 0 12 2 T 16 2'),
          fill: 'none',
          stroke: '#000000',
          strokeWidth: 2,
        },
        {
          id: 'demo-3',
          commands: parsePathString('M 1 6 C 2 5 4 5 5 6 S 7 7 8 6'),
          fill: 'none',
          stroke: '#000000',
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
            
            {/* Path Command Editor */}
            <PathCommandEditor />
            
            <div>
              <h3 className="text-sm font-medium mb-2">Instructions</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Mouse wheel: Zoom in/out</li>
                <li>• Space + drag: Pan (any tool)</li>
                <li>• Middle click + drag: Pan</li>
                <li>• Pan tool + drag: Pan</li>
                <li>• Pen tool + click: Start/continue path</li>
                <li>• Double-click: Finish drawing</li>
                <li>• Enter/Esc: Finish drawing</li>
                <li>• Grid toggle: Show/hide grid with numbers</li>
                <li>• Click path name: Select/deselect</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Canvas area */}
        <main className="flex-1 bg-gray-50">
          <SvgViewport 
            className="w-full h-full shadow-lg"
          >
            <PathRenderer />
          </SvgViewport>
        </main>
      </div>
    </div>
  )
}

export default App
