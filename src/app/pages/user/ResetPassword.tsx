"use client";

import { useState, useTransition, useEffect } from "react";
import { AuthLayout } from "@/app/layouts/AuthLayout";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { link } from "@/app/shared/links";
import { verifyResetToken, resetPassword } from "./functions";

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Get token from URL
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    
    if (urlToken) {
      setToken(urlToken);
      
      // Verify token
      startTransition(async () => {
        const user = await verifyResetToken(urlToken);
        if (user) {
          setIsValid(true);
          setUsername(user.username);
        } else {
          setIsValid(false);
          setResult("This password reset link is invalid or has expired.");
        }
      });
    } else {
      setIsValid(false);
      setResult("No reset token provided.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setResult("Passwords don't match");
      return;
    }
    
    startTransition(async () => {
      try {
        const success = await resetPassword(token, password);
        if (success) {
          setIsSuccess(true);
          setResult("Your password has been reset successfully.");
        } else {
          setResult("Failed to reset password. The link may have expired.");
        }
      } catch (error) {
        console.error(error);
        setResult("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <AuthLayout>
      <div className="flex min-h-[calc(100vh-96px)] items-center justify-center bg-bg">
        <Card className="w-full max-w-md sm:p-4 shadow-lg bg-background/60">
          <CardHeader>
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              {isValid === true ? `Hello ${username}, create a new password below.` : "Verify your reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isValid === null ? (
              <div className="text-center py-4">Verifying reset link...</div>
            ) : isValid === false ? (
              <div className="text-center py-4">
                <p className="mb-4 text-destructive">{result}</p>
                <Button variant="outline" onClick={() => window.location.href = link("/user/forgot-password")}>
                  Request New Reset Link
                </Button>
              </div>
            ) : isSuccess ? (
              <div className="text-center py-4">
                <p className="mb-4 text-green-600">{result}</p>
                <Button onClick={() => window.location.href = link("/user/login")}>
                  Go to Login
                </Button>
              </div>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {result && <div className="text-destructive text-sm">{result}</div>}
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}