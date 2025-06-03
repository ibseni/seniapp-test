import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    
    if (!code) {
      throw new Error("No code provided");
    }

    const supabase = await createClient();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Auth error:", error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?message=${encodeURIComponent(error.message)}`
      );
    }

    // Successful auth
    return NextResponse.redirect(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?message=${encodeURIComponent(
        "An error occurred during authentication"
      )}`
    );
  }
}
