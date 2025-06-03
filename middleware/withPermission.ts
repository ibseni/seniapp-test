import { NextResponse } from "next/server";
import { hasPermission } from "@/utils/permissions";

export function withPermission(requiredAction: string) {
  return async function(req: Request) {
    try {
      const userId = req.headers.get("user-id");
      
      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      const hasAccess = await hasPermission(userId, requiredAction);
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }

      // Permission granted, continue with the request
      return NextResponse.next();
    } catch (error) {
      console.error("Error in permission middleware:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}

// HOC for React components
export function withPagePermission(requiredAction: string) {
  return async function(context: { params: any }) {
    try {
      // Get user ID from session/auth
      const userId = ""; // TODO: Get from auth context
      
      if (!userId) {
        return {
          redirect: {
            destination: "/login",
            permanent: false,
          },
        };
      }

      const hasAccess = await hasPermission(userId, requiredAction);
      
      if (!hasAccess) {
        return {
          redirect: {
            destination: "/unauthorized",
            permanent: false,
          },
        };
      }

      // Permission granted, continue with the page render
      return {
        props: {
          ...context.params,
        },
      };
    } catch (error) {
      console.error("Error in page permission check:", error);
      return {
        redirect: {
          destination: "/error",
          permanent: false,
        },
      };
    }
  };
} 