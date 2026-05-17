"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SheetContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue>({
  open: false,
  onOpenChange: () => {},
})

function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  return (
    <SheetContext.Provider value={{ open: isOpen, onOpenChange: setOpen }}>
      {children}
    </SheetContext.Provider>
  )
}

function SheetTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const { onOpenChange } = React.useContext(SheetContext)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      onClick: (e: React.MouseEvent) => {
        const child = children as React.ReactElement<{ onClick?: React.MouseEventHandler }>
        child.props.onClick?.(e)
        onOpenChange(true)
      },
    })
  }

  return (
    <button onClick={() => onOpenChange(true)}>
      {children}
    </button>
  )
}

function SheetClose({
  children,
  asChild,
}: {
  children?: React.ReactNode
  asChild?: boolean
}) {
  const { onOpenChange } = React.useContext(SheetContext)

  if (asChild && children && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      onClick: () => onOpenChange(false),
    })
  }

  return (
    <button onClick={() => onOpenChange(false)}>
      {children}
    </button>
  )
}

function SheetContent({
  className,
  children,
  side = "right",
}: {
  className?: string
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
}) {
  const { open, onOpenChange } = React.useContext(SheetContext)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onOpenChange])

  if (!open) return null

  const sideClasses = {
    right: "inset-y-0 right-0 h-full w-3/4 sm:max-w-sm border-l",
    left: "inset-y-0 left-0 h-full w-3/4 sm:max-w-sm border-r",
    top: "inset-x-0 top-0 w-full border-b",
    bottom: "inset-x-0 bottom-0 w-full border-t",
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={() => onOpenChange(false)}
      />
      {/* Panel */}
      <div
        className={cn(
          "fixed z-50 flex flex-col bg-popover text-popover-foreground shadow-lg",
          sideClasses[side],
          className
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 rounded-sm p-1 opacity-70 hover:opacity-100 transition-opacity"
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-base font-medium text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
