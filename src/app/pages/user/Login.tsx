"use client";

import { useState, useTransition, useEffect } from "react";
import { AuthLayout } from "@/app/layouts/AuthLayout"
import {
  startAuthentication,
} from "@simplewebauthn/browser";
import {
  finishPasskeyLogin,
  startPasskeyLogin,
  loginWithPassword,
} from "./functions";
import { cn } from "@/app/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { link } from "@/app/shared/links";

export function Login() {
  // Email/password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Passkey state
  const [username, setUsername] = useState("");
  const [result, setResult] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  const passkeyLogin = async () => {
    // 1. Get a challenge from the worker
    const options = await startPasskeyLogin();

    // 2. Ask the browser to sign the challenge
    const login = await startAuthentication({ optionsJSON: options });

    // 3. Give the signed challenge to the worker to finish the login process
    const success = await finishPasskeyLogin(login);

    if (!success) {
      setResult("Login failed");
    } else {
      window.location.href = link("/");
    }
  };

  const handlePerformPasskeyLogin = () => {
    startTransition(() => void passkeyLogin());
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      try {
        const success = await loginWithPassword(email, password);
        if (success) {
          window.location.href = link("/");
        } else {
          setResult("Invalid email or password");
        }
      } catch (error) {
        setResult("Login failed");
      }
    });
  };

  // Show a skeleton loader while on the server or during initial client render
  if (!isClient) {
    return (
      <AuthLayout>
        <div className="flex min-h-[calc(100vh-96px)] items-center justify-center bg-bg">
          <Card className="w-full max-w-md p-8 shadow-lg bg-background/60">
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
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
      <Card className="w-full max-w-md p-8 shadow-lg bg-background/60">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Choose your preferred login method below or{" "}
            <a href={link('/user/signup')} className="font-display font-bold text-black text-sm underline underline-offset-8 hover:decoration-primary">
              Register
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>

          {/* Email/Password Login */}
          <form className="flex flex-col gap-4 mb-6" onSubmit={handlePasswordLogin}>
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
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <>...</> : "Login with email"}
            </Button>
            <div className="mt-2 text-center text-sm text-muted-foreground">
              <a href="#" className="underline underline-offset-4">Forgot your password?</a>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-muted" />
            <span className="mx-4 text-muted-foreground text-xs uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-muted" />
          </div>

          {/* Passkey Login/Register */}
          <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); handlePerformPasskeyLogin(); }}>
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
              {isPending ? <>...</> : "Login with passkey"}
            </Button>
            
            {result && <div className="mt-4 text-center text-sm text-muted-foreground">{result}</div>}
          </form>
        </CardContent>
      </Card>
    </div></AuthLayout>
  );
}
