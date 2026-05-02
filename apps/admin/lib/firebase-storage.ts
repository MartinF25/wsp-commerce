import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

function init() {
  if (getApps().length > 0) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const bucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!raw || !bucket) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON und FIREBASE_STORAGE_BUCKET müssen als Env-Variablen gesetzt sein."
    );
  }

  initializeApp({
    credential: cert(JSON.parse(raw)),
    storageBucket: bucket,
  });
}

export function getAdminStorage() {
  init();
  return getStorage().bucket();
}

export function isStorageConfigured() {
  return !!(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON &&
    process.env.FIREBASE_STORAGE_BUCKET
  );
}
