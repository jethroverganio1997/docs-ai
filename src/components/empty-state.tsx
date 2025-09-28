"use client";

import type React from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="max-w-md w-full p-8 text-center border-dashed">
        <div className="flex flex-col items-center space-y-4">
          {icon && (
            <div className="p-3 rounded-full bg-muted text-muted-foreground">
              {icon}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-balance">{title}</h3>
            <p className="text-sm text-muted-foreground text-pretty leading-relaxed">
              {description}
            </p>
          </div>

          {action && (
            <Button onClick={action.onClick} className="mt-4">
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
