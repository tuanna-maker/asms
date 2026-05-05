import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("admin@demo.local");
  const [password, setPassword] = useState("Password123!");

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Đăng nhập thành công");
    } catch {
      toast.error("Đăng nhập thất bại");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold">Đăng nhập hệ thống</h1>
          <p className="text-sm text-muted-foreground">Sử dụng tài khoản đã seed để truy cập.</p>
        </div>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Mật khẩu</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
