import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Separator } from "./separator"

const Sidebar = React.forwardRef(({ className, mobileOpen, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed h-screen w-64 left-0 top-0 z-50 flex flex-col bg-card border-r shadow-lg", 
      "md:flex", // Always show on desktop
      mobileOpen ? "flex" : "hidden", // Show on mobile only when mobileOpen is true
      className
    )}
    {...props}
  />
))
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SidebarTitle.displayName = "SidebarTitle"

const SidebarDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SidebarDescription.displayName = "SidebarDescription"

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 px-3 py-2", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-4 border-t", className)}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1", className)}
    {...props}
  />
))
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-3 py-2 text-xs font-medium text-muted-foreground", className)}
    {...props}
  />
))
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuButton = React.forwardRef(({ className, children, icon, active, ...props }, ref) => (
  <Button
    ref={ref}
    variant={active ? "default" : "ghost"}
    className={cn(
      "w-full justify-start text-left font-normal",
      active && "bg-primary text-primary-foreground",
      className
    )}
    {...props}
  >
    {icon && <span className="mr-3">{icon}</span>}
    {children}
  </Button>
))
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  Sidebar,
  SidebarContent,
  SidebarDescription,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTitle,
}
