"use client";

import * as React from "react";
import {
  Tabs as PrimitiveTabs,
  TabsContent as PrimitiveTabsContent,
  TabsList as PrimitiveTabsList,
  TabsTrigger as PrimitiveTabsTrigger,
} from "@/components/primitives/ui/tabs";
import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof PrimitiveTabs>) {
  return <PrimitiveTabs className={className} {...props} />;
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof PrimitiveTabsList>) {
  return (
    <PrimitiveTabsList
      className={cn("hover:bg-accent hover:text-accent-foreground", className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof PrimitiveTabsTrigger>) {
  return (
    <PrimitiveTabsTrigger
      className={cn("px-6 py-1 cursor-pointer", className)}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof PrimitiveTabsContent>) {
  return (
    <PrimitiveTabsContent className={cn("px-1 py-2", className)} {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
