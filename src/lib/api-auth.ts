import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "./firebase-admin";

type AuthResult =
  | { ok: true; uid: string; email?: string }
  | { ok: false; response: NextResponse };

// Verifies the Firebase ID token from the Authorization header. Config
// problems (missing service-account credentials) surface as a clear 500
// instead of a misleading 401 "Invalid token".
export async function verifyBearerToken(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.split("Bearer ")[1]);
    return { ok: true, uid: decoded.uid, email: decoded.email };
  } catch (err) {
    if (err instanceof Error && err.message.includes("FIREBASE_ADMIN_NOT_CONFIGURED")) {
      console.error(err.message);
      return {
        ok: false,
        response: NextResponse.json(
          {
            error:
              "Server not configured: add your Firebase Admin service-account key to .env.local " +
              "(FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY), then restart the dev server.",
          },
          { status: 500 }
        ),
      };
    }
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }
}
