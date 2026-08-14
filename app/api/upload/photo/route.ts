import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/upload/photo
// New route. Accepts a multipart form with "file" and "recipientId"
// fields, stores the image as a base64 data URI on
// recipient.photoUrl (requires the schema addition in
// prisma/schema-addition.txt — Recipient.photoUrl).
export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const recipientId = formData.get("recipientId")?.toString();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!recipientId) {
    return NextResponse.json({ error: "No recipientId provided." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type. Use PNG, JPEG, or WebP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large. Max 2MB." }, { status: 400 });
  }

  const recipient = await prisma.recipient.findUnique({ where: { id: recipientId } });
  if (!recipient || recipient.organizationId !== session.organizationId) {
    return NextResponse.json({ error: "Recipient not found." }, { status: 404 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  await prisma.recipient.update({
    where: { id: recipientId },
    data: { photoUrl: dataUri } as any,
  });

  return NextResponse.json({ success: true, photoUrl: dataUri });
}
