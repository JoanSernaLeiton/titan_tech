import { LoaderCircle } from "lucide-react";

import { cn } from "@/shared/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn("animate-spin", className)} />;
}
