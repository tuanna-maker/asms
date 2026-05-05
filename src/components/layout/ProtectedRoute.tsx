import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRole, ROLE_LABELS, ROUTE_PERMISSIONS } from "@/hooks/use-role";
import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { role, canAccess } = useRole();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (canAccess(location.pathname)) return <>{children}</>;

  const allowed = ROUTE_PERMISSIONS[location.pathname] || [];

  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <Card className="p-8 max-w-md text-center space-y-3">
        <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Không có quyền truy cập</h2>
        <p className="text-sm text-muted-foreground">
          Vai trò hiện tại <span className="font-medium text-foreground">{ROLE_LABELS[role]}</span> không được phép xem trang này.
        </p>
        <p className="text-xs text-muted-foreground">
          Yêu cầu vai trò: {allowed.map((r) => ROLE_LABELS[r]).join(", ")}
        </p>
      </Card>
    </div>
  );
};

export default ProtectedRoute;
