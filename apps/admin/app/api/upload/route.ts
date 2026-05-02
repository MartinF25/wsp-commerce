import { NextRequest, NextResponse } from "next/server";
import { getAdminStorage } from "@/lib/firebase-storage";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const file = formData.get("file");
  const folder = (formData.get("folder") as string | null) ?? "uploads";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei im Request." }, { status: 400 });
  }

  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json(
      { error: `Dateityp nicht erlaubt: ${file.type}. Erlaubt: JPEG, PNG, WEBP, GIF, SVG, PDF.` },
      { status: 415 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Datei zu groß (max. 10 MB)." }, { status: 413 });
  }

  try {
    const bucket = getAdminStorage();

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = ALLOWED_TYPES[file.type];
    const baseName = safeName.replace(/\.[^.]+$/, "");
    const storagePath = `${folder}/${timestamp}_${baseName}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
    });

    const bucketName = bucket.name.trim();
    const encodedPath = encodeURIComponent(storagePath);
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload] Firebase Storage Fehler:", err);
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: `Upload fehlgeschlagen: ${msg}` }, { status: 500 });
  }
}
