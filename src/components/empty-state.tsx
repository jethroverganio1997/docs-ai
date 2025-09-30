
import type React from "react"

import { FileX, Search, Inbox, Image } from "lucide-react"

interface EmptyStateProps {
  icon?: "inbox" | "search" | "file" | "custom" | "image"
  customIcon?: React.ReactNode
  title: string
  description: string
}

export function EmptyState({
  icon = "inbox",
  customIcon,
  title,
  description,
}: EmptyStateProps) {
  const iconMap = {
    inbox: Inbox,
    search: Search,
    file: FileX,
    image: Image,
    custom: null,
  }

  const IconComponent = customIcon ? null : iconMap[icon]

  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center space-y-2 p-12 text-center">
          <div className="p-6">
            {customIcon ? (
              <div className="h-12 w-12 text-muted-foreground">{customIcon}</div>
            ) : IconComponent ? (
              <IconComponent className="h-12 w-12 text-muted-foreground" />
            ) : null}
          </div>

          <div className="space-y-2">
            <h3 className="text-balance text-2xl font-semibold tracking-tight">{title}</h3>
            <p className="text-pretty text-sm text-muted-foreground leading-relaxed max-w-sm">{description}</p>
          </div>

        </div>
      </div>
    </div>
  )
}
