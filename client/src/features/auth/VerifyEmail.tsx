import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { AUTH_ROUTES } from "@/utils/constants";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const verify = async () => {
      try {
        await apiClient.post(`${AUTH_ROUTES}/verify-email`, { token });
        setStatus("success");
        toast.success("Email verified successfully!");
      } catch (error: any) {
        setStatus("error");
        toast.error(error.response?.data || "Verification failed");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#1c1d25] text-white">
      <div className="bg-[#2a2b36] p-10 rounded-2xl shadow-xl flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold">Email Verification</h1>
        {status === "loading" && <p>Verifying your email, please wait...</p>}
        {status === "success" && (
          <>
            <p className="text-green-400">Your email has been successfully verified.</p>
            <Button onClick={() => navigate("/auth")} className="bg-purple-500">Go to Login</Button>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-red-400">The verification link is invalid or has expired.</p>
            <Button onClick={() => navigate("/auth")} className="bg-purple-500">Go to Login</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
