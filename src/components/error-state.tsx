"use client"

import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, Home, ArrowLeft } from "lucide-react"

interface ErrorStateProps {
  title?: string
  description?: string
  errorCode?: string
  onRetry?: () => void
  onHome?: () => void
  onBack?: () => void
}

export function ErrorState({
  title = "Something went wrong",
  description = "We encountered an unexpected error. Please try again or contact support if the problem persists.",
  errorCode,
  onRetry,
  onHome,
  onBack,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center space-y-6 p-12 text-center">
          <div className="p-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>

          <div className="space-y-2">
            <h3 className="text-balance text-2xl font-semibold tracking-tight">{title}</h3>
            <p className="text-pretty text-sm text-muted-foreground leading-relaxed max-w-sm">{description}</p>
            {errorCode && <p className="text-xs font-mono text-muted-foreground/70 pt-2">Error Code: {errorCode}</p>}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {onRetry && (
              <Button onClick={onRetry} variant="default" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            {onBack && (
              <Button onClick={onBack} variant="outline" className="gap-2 bg-transparent">
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            )}
            {onHome && (
              <Button onClick={onHome} variant="outline" className="gap-2 bg-transparent">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
