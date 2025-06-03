"use server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return redirect("/login?message=Could not authenticate user");
  }

  return redirect("/");
}

export async function signUp(formData: FormData) {
  const headersResolved = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return redirect(`/login?message=${error.message}`);
  }

  return redirect("/login?message=Check email to continue sign in process");
}

export async function signInWithGoogleOAuth() {
  try {
    const headersResolved = await headers();
    const origin = headersResolved.get("origin");
    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error("No URL returned from Supabase");
    
    return redirect(data.url);
  } catch (error) {
    console.error("OAuth error:", error);
    return redirect("/login?message=Could not authenticate with Google");
  }
}
