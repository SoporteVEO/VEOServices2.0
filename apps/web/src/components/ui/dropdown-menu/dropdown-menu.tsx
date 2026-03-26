"use client";

import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuSub,
  DropdownMenuShortcut,
  DropdownMenuContent as DropdownMenuContentPrimitive,
  DropdownMenuTrigger as DropdownMenuTriggerPrimitive,
  DropdownMenuItem as DropdownMenuItemPrimitive,
  DropdownMenuCheckboxItem as DropdownMenuCheckboxItemPrimitive,
  DropdownMenuRadioItem as DropdownMenuRadioItemPrimitive,
  DropdownMenuLabel as DropdownMenuLabelPrimitive,
  DropdownMenuSeparator as DropdownMenuSeparatorPrimitive,
  DropdownMenuSubTrigger as DropdownMenuSubTriggerPrimitive,
  DropdownMenuSubContent as DropdownMenuSubContentPrimitive,
} from "@/components/primitives/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const menuItemEnhancements =
  "cursor-pointer px-2 py-1.5 transition-colors hover:bg-accent/80 hover:text-accent-foreground data-[variant=destructive]:hover:bg-destructive/15 data-[variant=destructive]:hover:text-destructive";

const menuItemChoiceEnhancements =
  "cursor-pointer px-2 py-1.5 transition-colors hover:bg-accent/80 hover:text-accent-foreground";

function DropdownMenuTrigger({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuTriggerPrimitive>) {
  return (
    <DropdownMenuTriggerPrimitive
      className={cn("cursor-pointer", className)}
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContentPrimitive>) {
  return (
    <DropdownMenuContentPrimitive
      className={cn(
        "p-2 shadow-md transition-shadow duration-150 data-open:shadow-lg",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuItemPrimitive>) {
  return (
    <DropdownMenuItemPrimitive
      className={cn(menuItemEnhancements, className)}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuCheckboxItemPrimitive>) {
  return (
    <DropdownMenuCheckboxItemPrimitive
      className={cn(menuItemChoiceEnhancements, className)}
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuRadioItemPrimitive>) {
  return (
    <DropdownMenuRadioItemPrimitive
      className={cn(menuItemChoiceEnhancements, className)}
      {...props}
    />
  );
}

function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuLabelPrimitive>) {
  return (
    <DropdownMenuLabelPrimitive
      className={cn("px-2 py-1.5", className)}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSeparatorPrimitive>) {
  return (
    <DropdownMenuSeparatorPrimitive
      className={cn("-mx-2 my-1.5", className)}
      {...props}
    />
  );
}

function DropdownMenuSubTrigger({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubTriggerPrimitive>) {
  return (
    <DropdownMenuSubTriggerPrimitive
      className={cn(
        "cursor-pointer px-2 py-1.5 transition-colors hover:bg-accent/80 data-open:bg-accent",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubContentPrimitive>) {
  return (
    <DropdownMenuSubContentPrimitive
      className={cn(
        "p-2 shadow-md transition-shadow duration-150 data-open:shadow-lg",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuSub,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
