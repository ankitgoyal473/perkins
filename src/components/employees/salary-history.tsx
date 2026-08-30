import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SalaryComponent } from "@/lib/salary";

export function SalaryHistory({
  history,
}: {
  history: Record<string, SalaryComponent[]>;
}) {
  const components = Object.entries(history);

  if (components.length === 0) {
    return <p className="text-sm text-muted-foreground">No salary records yet.</p>;
  }

  return (
    <div className="space-y-4">
      {components.map(([component, records]) => (
        <Card key={component}>
          <CardHeader>
            <CardTitle className="text-base">{component}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...records]
              .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
              .map((r, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>
                    {r.effectiveFrom.toLocaleDateString()} –{" "}
                    {r.effectiveTo ? r.effectiveTo.toLocaleDateString() : "present"}
                  </span>
                  <span className="flex items-center gap-2">
                    {r.amount.toLocaleString()} {r.currency}
                    {!r.effectiveTo && <Badge>current</Badge>}
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
