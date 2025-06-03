"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface LoginFormProps {
  message?: string;
}

export default function LoginForm({ message }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignInWithGoogle = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error("No URL returned from Supabase");

      window.location.href = data.url;
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome to SENI</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Button
                variant="outline"
                onClick={handleSignInWithGoogle}
                disabled={isLoading}
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                {isLoading ? "Connecting..." : "Continue with Google"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {message && (
          <p className="bg-muted p-4 text-sm text-muted-foreground text-center rounded-lg">
            {message}
          </p>
        )}
      </div>
    </div>
  );
} 