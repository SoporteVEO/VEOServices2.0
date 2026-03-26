import * as React from "react";
import {
  Dialog as PrimitiveDialog,
  DialogClose as PrimitiveDialogClose,
  DialogContent as PrimitiveDialogContent,
  DialogDescription as PrimitiveDialogDescription,
  DialogFooter as PrimitiveDialogFooter,
  DialogHeader as PrimitiveDialogHeader,
  DialogOverlay as PrimitiveDialogOverlay,
  DialogPortal as PrimitiveDialogPortal,
  DialogTitle as PrimitiveDialogTitle,
  DialogTrigger as PrimitiveDialogTrigger,
} from "@/components/primitives/ui/dialog";
import { cn } from "@/lib/utils";

type DialogSize = "sm" | "md" | "lg" | "xl";

const DIALOG_SIZE_CLASS: Record<DialogSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl lg:max-w-2xl",
};

type DialogContentProps = React.ComponentProps<
  typeof PrimitiveDialogContent
> & {
  size?: DialogSize;
};

function Dialog(props: React.ComponentProps<typeof PrimitiveDialog>) {
  return <PrimitiveDialog {...props} />;
}

function DialogTrigger(
  props: React.ComponentProps<typeof PrimitiveDialogTrigger>,
) {
  return <PrimitiveDialogTrigger {...props} />;
}

function DialogPortal(
  props: React.ComponentProps<typeof PrimitiveDialogPortal>,
) {
  return <PrimitiveDialogPortal {...props} />;
}

function DialogClose(props: React.ComponentProps<typeof PrimitiveDialogClose>) {
  return <PrimitiveDialogClose {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof PrimitiveDialogOverlay>) {
  return (
    <PrimitiveDialogOverlay
      className={cn(
        "bg-black/25 supports-backdrop-filter:backdrop-blur-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  size = "md",
  children,
  ...props
}: DialogContentProps) {
  return (
    <PrimitiveDialogContent
      className={cn(
        "flex max-h-[min(90dvh,calc(100dvh-2rem))] w-full flex-col gap-0 overflow-hidden rounded-2xl border bg-background p-0 shadow-xl",
        DIALOG_SIZE_CLASS[size],
        className,
      )}
      {...props}
    >
      {children}
    </PrimitiveDialogContent>
  );
}

function DialogHeader({
  className,
  ...props
}: React.ComponentProps<typeof PrimitiveDialogHeader>) {
  return (
    <PrimitiveDialogHeader
      className={cn("shrink-0 px-6 pt-6 pb-4 text-left", className)}
      {...props}
    />
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6 overscroll-contain pt-1",
        className,
      )}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  ...props
}: React.ComponentProps<typeof PrimitiveDialogFooter>) {
  return (
    <PrimitiveDialogFooter
      className={cn("px-6 pb-6 pt-2", className)}
      {...props}
    />
  );
}

function DialogTitle(props: React.ComponentProps<typeof PrimitiveDialogTitle>) {
  return <PrimitiveDialogTitle {...props} />;
}

function DialogDescription(
  props: React.ComponentProps<typeof PrimitiveDialogDescription>,
) {
  return <PrimitiveDialogDescription {...props} />;
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
export type { DialogContentProps, DialogSize };
