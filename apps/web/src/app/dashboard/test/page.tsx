import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TestPage() {
  return (
    <section className="flex flex-col h-full justify-center gap-4">
      <Input placeholder="Email" className="w-fit" />
      <Input placeholder="Password" className="w-fit" />
      <Button className="w-fit align-end">Test</Button>
    </section>
  );
}
