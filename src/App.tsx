import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold text-center mb-8">SVG Path Editor</h1>
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to SVG Path Editor</CardTitle>
              <CardDescription>
                A modern SVG path editor built with React 19 and TailwindCSS 4
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => setCount(count => count + 1)}>count is {count}</Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Project setup is working correctly!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default App
