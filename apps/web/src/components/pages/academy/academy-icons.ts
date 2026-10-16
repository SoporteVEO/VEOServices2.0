import {
  BookMarked,
  Factory,
  FileImage,
  Handshake,
  Kanban,
  Landmark,
  Rocket,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  rocket: Rocket,
  handshake: Handshake,
  "file-image": FileImage,
  factory: Factory,
  landmark: Landmark,
  kanban: Kanban,
  book: BookMarked,
};

export function academyCategoryIcon(icon: string): LucideIcon {
  return CATEGORY_ICONS[icon] ?? BookMarked;
}
