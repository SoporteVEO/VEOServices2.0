import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";

/** Radix wraps viewport content in a `display: table` div that grows past the drawer; forcing block keeps it at the drawer width. */
export function CrmDrawerPanel({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TabsContent value={value} className="min-h-0 min-w-0 flex-1 data-[state=inactive]:hidden">
      <ScrollArea className="h-full [&_[data-slot=scroll-area-viewport]>div]:block!">
        {children}
      </ScrollArea>
    </TabsContent>
  );
}
