import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  badgeText?: string;
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = "primary",
  badgeText
}: MetricCardProps) => {

  const variantStyles = {
    default: {
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-600",
    },
    primary: {
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-600",
    },
    success: {
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-600",
    },
    warning: {
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      badgeBg: "bg-amber-50",
      badgeText: "text-amber-600",
    },
    destructive: {
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      badgeBg: "bg-red-50",
      badgeText: "text-red-600",
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card className="hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-blue-200 hover:border-blue-600 hover:ring-2 hover:ring-blue-600 shadow-sm cursor-pointer bg-gradient-to-br from-white to-blue-50">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-3 rounded-xl", styles.iconBg)}>
            <Icon className={cn("h-6 w-6", styles.iconColor)} />
          </div>
          {badgeText && (
            <div className={cn("px-3 py-1 rounded-full text-xs font-medium", styles.badgeBg, styles.badgeText)}>
              {badgeText}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-blue-500 uppercase tracking-wide">
            {title}
          </h3>
          <div className="text-3xl font-bold text-slate-900">
            {value}
          </div>
        </div>

        {description && (
          <p className="text-sm text-muted-foreground mt-2">
            {description}
          </p>
        )}

        {trend && (
          <div className={cn(
            "text-xs mt-2 font-medium flex items-center gap-1",
            trend.isPositive ? "text-emerald-600" : "text-red-600"
          )}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% vs período anterior
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
