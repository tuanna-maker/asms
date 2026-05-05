import { Shield } from "lucide-react";
import { useRole, ROLE_LABELS, Role } from "@/hooks/use-role";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RoleSwitcher = () => {
  const { role, setRole } = useRole();
  return (
    <div className="flex items-center gap-2">
      <Shield className="h-4 w-4 text-muted-foreground" />
      <Select value={role} onValueChange={(v: Role) => setRole(v)}>
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
