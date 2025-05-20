"use client";

import { useState, useTransition } from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import {
  finishPasskeyLogin,
  finishPasskeyRegistration,
  startPasskeyLogin,
  startPasskeyRegistration,
} from "./functions";
import { cn } from "@/app/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";

export function Login() {
  // Email/password state (for demo, not functional)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Passkey state
  const [username, setUsername] = useState("");
  const [result, setResult] = useState("");
  const [isPending, startTransition] = useTransition();

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
      setResult("Login successful!");
    }
  };

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
      setResult("Registration successful!");
    }
  };

  const handlePerformPasskeyLogin = () => {
    startTransition(() => void passkeyLogin());
  };

  const handlePerformPasskeyRegister = () => {
    startTransition(() => void passkeyRegister());
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Choose your preferred login method below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Email/Password Login */}
          <form className="flex flex-col gap-4 mb-6" onSubmit={e => e.preventDefault()}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="m@example.com"
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
            <Button type="submit" className="w-full" disabled>
              Login (demo only)
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
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              className="w-full"
              onClick={handlePerformPasskeyRegister}
            >
              {isPending ? <>...</> : "Register with passkey"}
            </Button>
            {result && <div className="mt-4 text-center text-sm text-muted-foreground">{result}</div>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
