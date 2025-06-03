import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get the origin from the request URL
  const origin = request.headers.get('origin') || 'http://localhost:3000';
  const loginUrl = new URL('/login', origin);

  return NextResponse.redirect(loginUrl);
} 