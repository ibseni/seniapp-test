import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";
  const redirectTo = new URL(next, request.url);

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash,
    });
    if (!error) {
      redirectTo.pathname = "/";
      return NextResponse.redirect(redirectTo.toString());
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = "/";
  redirectTo.searchParams.set("error", "Invalid token");
  return NextResponse.redirect(redirectTo.toString());
}
