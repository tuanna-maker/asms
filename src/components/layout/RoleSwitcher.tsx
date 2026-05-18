import { Shield } from "lucide-react";
import { useRole, ROLE_LABELS, Role } from "@/hooks/use-role";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RoleSwitcher = () => {
  const { role, setRole } = useRole();
  const { user } = useAuth();
  const lockedToAccount = Boolean(user);

  return (
    <div className="flex items-center gap-2" title={lockedToAccount ? "Vai trò theo tài khoản đăng nhập (khớp quyền API)" : undefined}>
      <Shield className="h-4 w-4 text-muted-foreground" />
      <Select value={role} onValueChange={(v: Role) => setRole(v)} disabled={lockedToAccount}>
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <SelectItem key={r} value={r} className="text-xs">{ROLE_LABELS[r]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RoleSwitcher;
