import { SvgViewport } from '@/components/svg-editor'
import { useEditorStore } from '@/stores/editor-store'
import { Button } from '@/components/ui/button'

function App() {
  const { zoom, tool, setTool, gridVisible, toggleGrid, resetView } = useEditorStore()

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
              <h3 className="text-sm font-medium mb-2">Instructions</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Mouse wheel: Zoom in/out</li>
                <li>• Middle click + drag: Pan</li>
                <li>• Pan tool + drag: Pan</li>
                <li>• Grid toggle: Show/hide grid</li>
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
              {/* Demo content */}
              <circle 
                cx="100" 
                cy="100" 
                r="50" 
                fill="none" 
                stroke="hsl(var(--primary))" 
                strokeWidth="2"
              />
              <rect
                x="200"
                y="50"
                width="100"
                height="100"
                fill="none"
                stroke="hsl(var(--destructive))"
                strokeWidth="2"
              />
              <path
                d="M 400 100 Q 450 50 500 100 T 600 100"
                fill="none"
                stroke="hsl(var(--secondary-foreground))"
                strokeWidth="2"
              />
            </SvgViewport>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
