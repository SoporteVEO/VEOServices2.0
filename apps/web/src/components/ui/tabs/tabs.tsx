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
      className={className}
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
      className={cn("cursor-pointer px-4", className)}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof PrimitiveTabsContent>) {
  return (
    <PrimitiveTabsContent className={cn("py-3", className)} {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
