import NextImage from "next/image";
import { AGENT_AVATAR_SRC, AGENT_NAME } from "@/lib/agent-brand";
import { cn } from "@/lib/utils";

interface NexoAvatarProps {
  size: number;
  className?: string;
  priority?: boolean;
}

export function NexoAvatar({ size, className, priority }: NexoAvatarProps) {
  return (
    <NextImage
      src={AGENT_AVATAR_SRC}
      alt={AGENT_NAME}
      width={size}
      height={size}
      priority={priority}
      draggable={false}
      className={cn("shrink-0 select-none object-contain", className)}
    />
  );
}
