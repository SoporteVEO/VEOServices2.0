import { MySpaceLayout } from "@/components/pages/my-space/my-space-layout";

export default function MySpaceRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MySpaceLayout>{children}</MySpaceLayout>;
}
