"use client";

import { useState, useTransition } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import {
  finishPasskeyRegistration,
  startPasskeyRegistration,
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

  return (
    <AuthLayout>
      <div className="flex min-h-[calc(100vh-96px)] items-center justify-center bg-bg">
        <Card className="w-full max-w-md p-8 shadow-lg bg-background/60">
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
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}