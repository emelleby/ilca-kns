"use client";

import { useState, useTransition } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { addPasskeyToExistingAccount, addPasswordToPasskeyAccount } from "../functions";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

export default function AuthSettings({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState("");
  
  // Email/password states
  const [email, setEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Add passkey to account with email/password
  const addPasskey = async () => {
    // Similar to passkeyRegister but using addPasskeyToExistingAccount
    // Implementation details...
  };
  
  // Add email/password to passkey account
  const addEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setResult("Passwords don't match");
      return;
    }
    
    startTransition(async () => {
      try {
        const success = await addPasswordToPasskeyAccount(user.id, email, password);
        if (success) {
          setResult("Email and password added successfully");
        } else {
          setResult("Failed to add email and password");
        }
      } catch (error) {
        setResult("An error occurred");
      }
    });
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Settings</h1>
      
      {/* Show appropriate card based on user's current auth method */}
      {!user.password && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Email & Password</CardTitle>
            <CardDescription>
              Add email and password authentication to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addEmailPassword} className="space-y-4">
              {/* Form fields */}
              <Button type="submit" disabled={isPending}>
                Add Email & Password
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      
      {user.credentials?.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Add Passkey</CardTitle>
            <CardDescription>
              Add a passkey for more secure authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => startTransition(() => void addPasskey())} disabled={isPending}>
              Add Passkey
            </Button>
          </CardContent>
        </Card>
      )}
      
      {result && <p className="mt-4 text-center">{result}</p>}
    </div>
  );
}