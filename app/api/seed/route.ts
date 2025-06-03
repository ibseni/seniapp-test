import { seedRolesAndPermissions } from "@/app/serverActions/auth/seedRolesAndPermissions";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if user is admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Seed roles and permissions
    const result = await seedRolesAndPermissions();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Roles and permissions seeded successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in seed route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 