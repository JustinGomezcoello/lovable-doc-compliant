import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const MetricCard = ({ title, value, icon: Icon, description, trend }: MetricCardProps) => {
  return (
    <Card className="hover:shadow-elevated transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div className={`text-xs mt-2 ${trend.isPositive ? "text-success" : "text-destructive"}`}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% vs período anterior
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
