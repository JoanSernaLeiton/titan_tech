import type { ReactNode } from "react";

import { Card, CardContent } from "@/shared/components/ui/card";
import { Spinner } from "@/shared/components/ui/spinner";

interface PageStateProps {
  message: string;
  tone?: "default" | "error";
  icon?: ReactNode;
}

export function PageState({ message, tone = "default", icon }: PageStateProps) {
  const toneClasses =
    tone === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : "border-border/70 bg-muted/30 text-muted-foreground";

  return (
    <Card className={toneClasses}>
      <CardContent className="flex items-center justify-center gap-3 py-8 text-sm">
        {icon}
        <span>{message}</span>
      </CardContent>
    </Card>
  );
}

export function LoadingState({ message }: { message: string }) {
  return <PageState message={message} icon={<Spinner className="size-4" />} />;
}
