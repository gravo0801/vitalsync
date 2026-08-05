import { NextRequest, NextResponse } from "next/server";

import { firebaseConfig } from "@/lib/firebaseConfig";

export const dynamic = "force-dynamic";

interface FirebaseProjectConfig {
  authorizedDomains?: string[];
  idpConfig?: Array<{
    provider?: string;
    enabled?: boolean;
  }>;
}

export async function GET(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";

  const endpoint = new URL(
    "https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig",
  );
  endpoint.searchParams.set("key", firebaseConfig.apiKey);

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    const payload = (await response.json()) as FirebaseProjectConfig & {
      error?: { message?: string };
    };

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          host,
          status: response.status,
          firebaseError: payload.error?.message ?? "Firebase config lookup failed",
        },
        { status: 502 },
      );
    }

    const authorizedDomains = payload.authorizedDomains ?? [];
    const googleProvider = payload.idpConfig?.find(
      (provider) => provider.provider === "google.com",
    );

    return NextResponse.json({
      ok: true,
      host,
      currentHostAuthorized: authorizedDomains.includes(host),
      productionHostAuthorized: authorizedDomains.includes(
        "vitalsync-sigma.vercel.app",
      ),
      googleProviderConfigured: Boolean(googleProvider),
      googleProviderEnabled: googleProvider?.enabled !== false,
      authorizedDomains,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        host,
        firebaseError:
          error instanceof Error ? error.message : "Unknown diagnostic error",
      },
      { status: 502 },
    );
  }
}
