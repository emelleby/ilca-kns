"use client";

import { useState, useTransition, useEffect } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import {
  finishPasskeyRegistration,
  startPasskeyRegistration,
  registerWithPassword,
} from "./functions";
import { AuthLayout } from "@/app/layouts/AuthLayout";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { link } from "@/app/shared/links";

export function Signup() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isClient, setIsClient] = useState(false);
  const [showPasswordOption, setShowPasswordOption] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const passkeyRegister = async () => {
    // 1. Get a challenge from the worker
    const options = await startPasskeyRegistration(username);

    // 2. Ask the browser to sign the challenge
    const registration = await startRegistration({ optionsJSON: options });

    // 3. Give the signed challenge to the worker to finish the registration process
    const success = await finishPasskeyRegistration(username, registration);

    if (!success) {
      setResult("Registration failed");
    } else {
      window.location.href = link("/user/login");
    }
  };

  const handlePerformPasskeyRegister = () => {
    startTransition(() => void passkeyRegister());
  };

  const handlePasswordRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setResult("Passwords don't match");
      return;
    }
    
    startTransition(async () => {
      try {
        const success = await registerWithPassword(username, email, password);
        if (success) {
          window.location.href = link("/user/login");
        } else {
          setResult("Registration failed");
        }
      } catch (error) {
        setResult("Registration failed");
      }
    });
  };

  if (!isClient) {
    return (
      <AuthLayout>
        <div className="flex min-h-[calc(100vh-96px)] items-center justify-center bg-bg">
          <Card className="w-full max-w-md p-8 shadow-lg bg-background/60">
            <CardHeader>
              <CardTitle>Register a new account</CardTitle>
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">Loading...</div>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex min-h-[calc(100vh-96px)] items-center justify-center bg-bg">
        <Card className="w-full max-w-md sm:p-4 shadow-lg bg-background/60">
          <CardHeader>
            <CardTitle>Register a new account</CardTitle>
            <CardDescription>
              Create your account with a username and passkey or{" "}
              <a href={link("/user/login")} className="font-display font-bold text-black text-sm underline underline-offset-8 hover:decoration-primary">
                Login
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); handlePerformPasskeyRegister(); }}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Username"
                  autoComplete="username"
                  required
                />
              </div>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? <>...</> : "Register with passkey"}
              </Button>
              {result && <div className="mt-4 text-center text-sm text-destructive">{result}</div>}
            </form>
            <Button 
              variant="link" 
              onClick={() => setShowPasswordOption(!showPasswordOption)}
              className="w-full mt-2 cursor-pointer"
            >
              {showPasswordOption ? "Use passkey instead" : "Use email and password instead"}
            </Button>
            {showPasswordOption && (
              <form className="flex flex-col gap-4 mt-4" onSubmit={handlePasswordRegister}>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Username"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? <>...</> : "Register with email"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
