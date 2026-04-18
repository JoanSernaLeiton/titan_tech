import { Card, CardContent } from "@/shared/components/ui/card";

export function ReportsPlaceholder() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reportes</h1>
        <p className="text-muted-foreground mt-2">
          Genera y visualiza reportes completos de instalaciones solares
        </p>
      </div>

      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Reportes</h2>
              <p className="text-muted-foreground">Próximamente</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
