"use client";
import Link from "next/link";
import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = 'force-dynamic';

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  
  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] items-center justify-center">
      <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Accès non autorisé
          </h1>
          <p className="text-sm text-muted-foreground">
            {message || "Vous n'avez pas les permissions nécessaires pour accéder à cette page."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UnauthorizedContent />
    </Suspense>
  );
}
