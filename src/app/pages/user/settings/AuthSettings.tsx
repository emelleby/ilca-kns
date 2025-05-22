"use client";

import { useState, useTransition, useEffect } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { addPasskeyToExistingAccount, addPasswordToPasskeyAccount, startPasskeyRegistration } from "../functions";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { ClientOnly } from "@/app/components/ClientOnly";
import { CardSkeleton } from "@/app/components/ui/skeleton";

// Change to default export to match the import in routes.ts
export default function AuthSettings({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState("");
  console.log("user", user);
  
  // Email/password states
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Add passkey to account with email/password
  const addPasskey = async () => {
    try {
      // 1. Get registration options from the server
      const options = await startPasskeyRegistration(user.username);
      
      // 2. Create the passkey with the browser's API
      const registration = await startRegistration({ optionsJSON: options });
      
      // 3. Send the registration response to the server to verify and save
      const success = await addPasskeyToExistingAccount(user.id, registration);
      
      if (success) {
        setResult("Passkey added successfully");
        // Refresh the page to update the UI
        window.location.reload();
      } else {
        setResult("Failed to add passkey");
      }
    } catch (error) {
      console.error("Error adding passkey:", error);
      setResult("An error occurred while adding passkey");
    }
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
          // Refresh the page to update the UI
          window.location.reload();
        } else {
          setResult("Failed to add email and password");
        }
      } catch (error) {
        console.error("Error adding email/password:", error);
        setResult("An error occurred");
      }
    });
  };
  
  return (
    <ClientOnly fallback={<CardSkeleton />}>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Authentication Settings</h1>
        
        {/* Show appropriate card based on user's current auth method */}
        {!user?.password && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add Email & Password</CardTitle>
              <CardDescription>
                Add email and password authentication to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addEmailPassword} className="space-y-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Adding..." : "Add Email & Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
        
        {user?.credentials?.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Add Passkey</CardTitle>
              <CardDescription>
                Add a passkey for more secure authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Passkeys provide a more secure way to sign in without having to remember passwords. 
                They use biometric authentication (like fingerprint or face recognition) or your device's screen lock.
              </p>
              <Button 
                onClick={() => startTransition(() => void addPasskey())} 
                disabled={isPending}
              >
                {isPending ? "Adding..." : "Add Passkey"}
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Show current authentication methods */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your Authentication Methods</CardTitle>
            <CardDescription>
              These are the ways you can sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {user?.password && (
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Email and Password</span>
                </li>
              )}
              {user?.credentials?.length > 0 && (
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Passkey</span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
        
        {result && (
          <div className={`mt-4 p-3 rounded-md ${result.includes("success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {result}
          </div>
        )}
      </div>
    </ClientOnly>
  );
}
