import { Loader2 } from "lucide-react";
import { Skeleton } from "./skeleton";

interface LoadingStateProps {
  title?: string;
  message?: string;
  showSkeletons?: boolean;
  skeletonCount?: number;
}

export const LoadingState = ({ 
  title = "Cargando...", 
  message = "Obteniendo datos, por favor espera...",
  showSkeletons = true,
  skeletonCount = 8 
}: LoadingStateProps) => {
  return (
    <div className="space-y-6">
      {/* Header con indicador de carga */}
      <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-200">
        <div className="flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <h3 className="text-lg font-semibold text-blue-700">{title}</h3>
          <p className="text-sm text-blue-600 max-w-md">{message}</p>
        </div>
      </div>

      {/* Skeletons para las tarjetas */}
      {showSkeletons && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(skeletonCount)].map((_, i) => (
            <div key={i} className="relative">
              <Skeleton className="h-32 w-full rounded-lg">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground animate-pulse">
                    Cargando...
                  </span>
                </div>
              </Skeleton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoadingState;
