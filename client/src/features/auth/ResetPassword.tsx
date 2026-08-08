import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { RESET_PASSWORD_ROUTE } from "@/utils/constants";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleReset = async () => {
    if (!token) {
      toast.error("No reset token found in URL");
      return;
    }
    if (!password) {
      toast.error("Password is required");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await apiClient.post(RESET_PASSWORD_ROUTE, { token, newPassword: password });
      toast.success("Password reset successfully. You can now login.");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.response?.data || "Password reset failed");
    }
  };

  if (!token) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1c1d25] text-white">
        <p className="text-red-400">Invalid reset link.</p>
      </div>
    );
  }

  return (
    <div className="h-[100vh] bg-[url('/background.png')] w-[100vw] flex items-center justify-center">
      <div className="bg-[#2a2b36] p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-6 w-[90vw] md:w-[50vw] lg:w-[30vw]">
        <h1 className="text-3xl font-bold text-white">Reset Password</h1>
        <Input
          placeholder="New Password"
          type="password"
          className="rounded-full p-6 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          placeholder="Confirm New Password"
          type="password"
          className="rounded-full p-6 w-full"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button className="rounded-full p-6 bg-purple-500 w-full" onClick={handleReset}>
          Reset Password
        </Button>
      </div>
    </div>
  );
};

export default ResetPassword;
