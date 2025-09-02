import * as React from "react"

import { cn } from "@/lib/utils"

export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string
  children: React.ReactNode
}

const Tooltip = ({ content, children, className, ...props }: TooltipProps) => {
  const [isVisible, setIsVisible] = React.useState(false)

  return (
    <div className="relative inline-block" {...props}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className={cn(
          "absolute z-50 px-2 py-1 text-xs text-white bg-black rounded shadow-lg",
          "bottom-full left-1/2 transform -translate-x-1/2 mb-1",
          "whitespace-nowrap",
          className
        )}>
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black" />
        </div>
      )}
    </div>
  )
}

export { Tooltip }