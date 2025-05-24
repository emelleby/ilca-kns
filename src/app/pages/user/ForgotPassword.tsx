"use client";

import { useState, useTransition } from "react";
import { AuthLayout } from "@/app/layouts/AuthLayout";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { link } from "@/app/shared/links";
import { requestPasswordReset } from "./functions";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      try {
        const success = await requestPasswordReset(email);
        setSubmitted(true);
        // Always show success message even if email doesn't exist (security)
        setResult("If an account with that email exists, we've sent password reset instructions.");
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
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Sending..." : "Send Reset Link"}
                </Button>
                <div className="text-center mt-4">
                  <a href={link("/user/login")} className="text-sm text-primary hover:underline">
                    Back to Login
                  </a>
                </div>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="mb-4">{result}</p>
                <Button variant="outline" onClick={() => window.location.href = link("/user/login")}>
                  Return to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}