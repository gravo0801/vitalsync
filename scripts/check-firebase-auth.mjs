const apiKey = "AIzaSyBCJ8VBLzx_VmOyamqmJfI99xjVTuMlz4E";
const endpoint = new URL(
  "https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig",
);
endpoint.searchParams.set("key", apiKey);

try {
  const response = await fetch(endpoint);
  const payload = await response.json();

  if (!response.ok) {
    console.log(
      `[firebase-auth-diagnostics] lookup failed: ${response.status} ${payload?.error?.message ?? "unknown error"}`,
    );
    process.exit(0);
  }

  const authorizedDomains = payload.authorizedDomains ?? [];
  const googleProvider = (payload.idpConfig ?? []).find(
    (provider) => provider.provider === "google.com",
  );

  console.log(
    `[firebase-auth-diagnostics] authorizedDomains=${JSON.stringify(authorizedDomains)}`,
  );
  console.log(
    `[firebase-auth-diagnostics] productionAuthorized=${authorizedDomains.includes("vitalsync-sigma.vercel.app")}`,
  );
  console.log(
    `[firebase-auth-diagnostics] previewBranchAuthorized=${authorizedDomains.includes("vitalsync-git-agent-fix-vitalsync-lo-f49333-gravo0801s-projects.vercel.app")}`,
  );
  console.log(
    `[firebase-auth-diagnostics] googleProviderConfigured=${Boolean(googleProvider)} enabled=${googleProvider?.enabled !== false}`,
  );
} catch (error) {
  console.log(
    `[firebase-auth-diagnostics] request error: ${error instanceof Error ? error.message : String(error)}`,
  );
}
