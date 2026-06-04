// Lecture Firestore au BUILD via l'Admin SDK (server-only — jamais bundlé client).
// Credentials : env FIREBASE_SERVICE_ACCOUNT (CI, JSON string) ou
// fichier ./service-account.json (local, gitignoré).
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

let _db: Firestore | null = null;

function resolveCredential() {
  const envSa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envSa) {
    try {
      return cert(JSON.parse(envSa));
    } catch (e) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT n'est pas un JSON valide.");
    }
  }
  const localPath = join(process.cwd(), "service-account.json");
  if (existsSync(localPath)) {
    return cert(JSON.parse(readFileSync(localPath, "utf8")));
  }
  return null;
}

function getDb(): Firestore {
  if (_db) return _db;
  let app: App;
  if (getApps().length) {
    app = getApps()[0]!;
  } else {
    const credential = resolveCredential();
    if (!credential) {
      throw new Error(
        "Aucune credential Firebase pour le build. Définir FIREBASE_SERVICE_ACCOUNT ou placer usm-v2/service-account.json."
      );
    }
    app = initializeApp({ credential });
  }
  _db = getFirestore(app);
  return _db;
}

/** Rend une valeur Firestore sérialisable (Timestamp -> millis, récursif). */
function plain(value: any): any {
  if (value == null) return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (Array.isArray(value)) return value.map(plain);
  if (typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) out[k] = plain(v);
    return out;
  }
  return value;
}

export async function fetchCollection<T = any>(name: string): Promise<T[]> {
  const snap = await getDb().collection(name).get();
  return snap.docs.map((d) => ({ id: d.id, ...plain(d.data()) })) as T[];
}

export async function fetchDoc<T = any>(coll: string, id: string): Promise<T | null> {
  const snap = await getDb().collection(coll).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...plain(snap.data()) } as T;
}
