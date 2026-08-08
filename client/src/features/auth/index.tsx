import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { LOGIN_ROUTE, SIGNUP_ROUTE, FORGOT_PASSWORD_ROUTE } from "@/utils/constants";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";
import React from 'react';
import { animationDefaultOptions } from "@/lib/utils";
import Lottie from "react-lottie";

const Auth = () => {
  const navigate = useNavigate();
  const { setUserInfo } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const validateLogin = () => {
    if (!email.length) {
      toast.error("Email is required.");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required.");
      return false;
    }
    return true;
  };

  const validateSignup = () => {
    if (!email.length) {
      toast.error("Email is required.");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required.");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Password and ConfirmPassword should be same.");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (validateLogin()) {
      try {
        const response = await apiClient.post(
          LOGIN_ROUTE,
          { email, password },
          { withCredentials: true }
        );
        if (response.data.user.id) {
          setUserInfo(response.data.user);
          if (response.data.user.profileSetup) {
            navigate("/chat");
          } else {
            navigate("/profile");
          }
        }
      } catch (error: any) {
        toast.error(error.response?.data || "Login failed");
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email.length) {
      toast.error("Email is required.");
      return;
    }
    try {
      const response = await apiClient.post(
        FORGOT_PASSWORD_ROUTE,
        { email },
        { withCredentials: true }
      );
      toast.success(response.data);
      setIsForgotPassword(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Forgot password failed");
    }
  };

  const handleOAuth = (provider: string) => {
    window.location.href = `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/oauth/${provider.toLowerCase()}`;
  };

  const handleSignup = async () => {
    if (validateSignup()) {
      try {
        const response = await apiClient.post(
          SIGNUP_ROUTE,
          { email, password },
          { withCredentials: true }
        );
        if (response.status === 201) {
          setUserInfo(response.data.user);
          navigate("/profile");
        }
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Signup failed");
      }
    }
  };

  return (
    <div className="h-[100vh] bg-[url('/background.png')]  w-[100vw] flex  items-center justify-center ">
      <div className=" h-[95vh] bg-[#1c1d25]  text-opacity-90 shadow-2xl w-[80vw] md:w-[90vw] lg:w-[70vw] xl:w-[60vw] rounded-3xl   grid xl:grid-cols-2  ">
        <div className="flex flex-col gap-10 items-center justify-center ">
          <div className="flex items-center justify-center flex-col ">
          <div className="flex p-5  justify-start items-center gap-2">
      <svg
        id="logo-38"
        width="78"
        height="32"
        viewBox="0 0 78 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {" "}
        <path
          d="M55.5 0H77.5L58.5 32H36.5L55.5 0Z"
          className="ccustom"
          fill="#8338ec"
        ></path>{" "}
        <path
          d="M35.5 0H51.5L32.5 32H16.5L35.5 0Z"
          className="ccompli1"
          fill="#975aed"
        ></path>{" "}
        <path
          d="M19.5 0H31.5L12.5 32H0.5L19.5 0Z"
          className="ccompli2"
          fill="#a16ee8"
        ></path>{" "}
      </svg>
      <span className="text-5xl font-bold text-white ">Swift</span>
    </div>
            <p className="flex items-center justify-center w-full  text-white">
            Welcome to Swift. Let's chat!!
            </p>
          </div>
          <div className="flex flex-col items-center justify-center w-full ">
            <Tabs className="w-3/4" defaultValue="login">
              <TabsList className=" grid grid-cols-2 bg-transparent rounded-none gap-2 w-full ">
                <TabsTrigger
                  value="login"
                  className=" data-[state=active]:bg-transparent text-white text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-transparent text-white text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300"
                >
                  Signup
                </TabsTrigger>
              </TabsList>
              <TabsContent className="flex flex-col gap-5 mt-10" value="login">
                {isForgotPassword ? (
                  <>
                    <p className="text-white">Enter your email to reset your password.</p>
                    <Input
                      placeholder="Email"
                      type="email"
                      className="rounded-full p-6 "
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button className="rounded-full p-6 bg-purple-500 " onClick={handleForgotPassword}>
                      Send Reset Link
                    </Button>
                    <Button variant="ghost" className="text-white mt-2" onClick={() => setIsForgotPassword(false)}>
                      Back to Login
                    </Button>
                  </>
                ) : (
                  <>
                    <Input
                      placeholder="Email"
                      type="email"
                      className="rounded-full p-6 "
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                      placeholder="Password"
                      type="password"
                      className="rounded-full p-6 "
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button className="rounded-full p-6 bg-purple-500 " onClick={handleLogin}>
                      Login
                    </Button>
                    <div className="flex justify-between items-center text-sm text-gray-400 px-4">
                      <span className="cursor-pointer hover:text-white" onClick={() => setIsForgotPassword(true)}>
                        Forgot Password?
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <div className="h-[1px] bg-gray-700 flex-1"></div>
                      <span className="text-gray-500 text-xs uppercase">Or continue with</span>
                      <div className="h-[1px] bg-gray-700 flex-1"></div>
                    </div>
                    <div className="flex gap-4 w-full">
                      <Button variant="outline" className="flex-1 rounded-full p-6 text-black bg-white" onClick={() => handleOAuth("Google")}>
                        Google
                      </Button>
                      <Button variant="outline" className="flex-1 rounded-full p-6 text-white bg-gray-800" onClick={() => handleOAuth("GitHub")}>
                        GitHub
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>
              <TabsContent className="flex flex-col gap-5  " value="signup">
                <Input
                  placeholder="Email"
                  type="email"
                  className="rounded-full p-6 "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  placeholder="Password"
                  type="password"
                  className="rounded-full p-6 "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                  placeholder="Confirm Password"
                  type="password"
                  className="rounded-full p-6 "
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button className="rounded-full bg-purple-500 p-6" onClick={handleSignup}>
                  Signup
                </Button>
                <div className="flex items-center gap-2 mt-4">
                  <div className="h-[1px] bg-gray-700 flex-1"></div>
                  <span className="text-gray-500 text-xs uppercase">Or continue with</span>
                  <div className="h-[1px] bg-gray-700 flex-1"></div>
                </div>
                <div className="flex gap-4 w-full">
                  <Button variant="outline" className="flex-1 rounded-full p-6 text-black bg-white" onClick={() => handleOAuth("Google")}>
                    Google
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-full p-6 text-white bg-gray-800" onClick={() => handleOAuth("GitHub")}>
                    GitHub
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <div className="hidden xl:flex justify-center items-center">
        <Lottie
        isClickToPauseDisabled={true}
        height={400}
        width={400}
        options={animationDefaultOptions}
      />
        </div>
      </div>
    </div>
  );
};

export default Auth;
