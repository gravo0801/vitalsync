import { NextResponse } from "next/server";

import { firebaseConfig, PERSONAL_USER_ID } from "@/lib/firebaseConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  const documentUrl = new URL(
    `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/profiles/${PERSONAL_USER_ID}`,
  );
  documentUrl.searchParams.set("key", firebaseConfig.apiKey);

  try {
    const response = await fetch(documentUrl, { cache: "no-store" });
    const payload = (await response.json()) as {
      name?: string;
      fields?: Record<string, unknown>;
      error?: { status?: string; message?: string };
    };

    return NextResponse.json(
      {
        ok: response.ok,
        status: response.status,
        profileExists: Boolean(response.ok && payload.name),
        fieldCount: payload.fields ? Object.keys(payload.fields).length : 0,
        firestoreError: payload.error?.status ?? payload.error?.message ?? null,
      },
      { status: response.ok ? 200 : 502 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        profileExists: false,
        firestoreError:
          error instanceof Error ? error.message : "Unknown Firestore diagnostic error",
      },
      { status: 502 },
    );
  }
}
