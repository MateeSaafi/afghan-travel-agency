import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

function getAdminApp(): App {
  if (!adminApp) {
    if (getApps().length) {
      adminApp = getApps()[0];
    } else {
      const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "";
      const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");

      if (
        !projectId ||
        !clientEmail ||
        clientEmail.includes("xxxxx") ||
        privateKey.includes("REPLACE_ME") ||
        !privateKey.includes("BEGIN PRIVATE KEY")
      ) {
        throw new Error(
          "FIREBASE_ADMIN_NOT_CONFIGURED: fill FIREBASE_ADMIN_CLIENT_EMAIL and " +
            "FIREBASE_ADMIN_PRIVATE_KEY in .env.local with a service-account key " +
            "(Firebase Console > Project Settings > Service Accounts > Generate new private key)"
        );
      }

      adminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    }
  }
  return adminApp;
}

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    if (!firestoreInstance) {
      firestoreInstance = getFirestore(getAdminApp());
    }
    return (firestoreInstance as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!authInstance) {
      authInstance = getAuth(getAdminApp());
    }
    return (authInstance as unknown as Record<string | symbol, unknown>)[prop];
  },
});
