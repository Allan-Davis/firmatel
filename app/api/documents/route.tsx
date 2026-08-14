import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateVerificationCode() {
  return crypto.randomBytes(16).toString("hex").toUpperCase();
}

function generateDocumentNumber(prefix?: string | null) {
  const cleanPrefix =
    prefix?.trim().replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "DOC";

  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `${cleanPrefix}-${timestamp}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const documents = await prisma.document.findMany({
      where: {
        organizationId: session.organizationId,

        ...(status
          ? {
              status: status as
                | "DRAFT"
                | "ISSUED"
                | "REVOKED"
                | "EXPIRED",
            }
          : {}),

        ...(search
          ? {
              OR: [
                {
                  documentNumber: {
                    contains: search,
                  },
                },
                {
                  title: {
                    contains: search,
                  },
                },
                {
                  documentType: {
                    contains: search,
                  },
                },
                {
                  verificationCode: {
                    contains: search,
                  },
                },
                {
                  recipient: {
                    fullName: {
                      contains: search,
                    },
                  },
                },
              ],
            }
          : {}),
      },

      include: {
        recipient: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("Documents GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve documents.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const documentType = String(body.documentType || "").trim();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const recipientId = String(body.recipientId || "").trim();
    const expiryDate = String(body.expiryDate || "").trim();
    const status = String(body.status || "ISSUED").trim();

    if (!documentType || !title) {
      return NextResponse.json(
        {
          success: false,
          message: "Document type and title are required.",
        },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: {
        id: session.organizationId,
      },
    });

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          message: "Organization not found.",
        },
        { status: 404 }
      );
    }

    let recipient = null;

    if (recipientId) {
      recipient = await prisma.recipient.findFirst({
        where: {
          id: recipientId,
          organizationId: session.organizationId,
        },
      });

      if (!recipient) {
        return NextResponse.json(
          {
            success: false,
            message: "Recipient not found.",
          },
          { status: 404 }
        );
      }
    }

    const documentNumber = generateDocumentNumber(
      organization.documentPrefix
    );

    const verificationCode = generateVerificationCode();

    const verificationUrl =
      organization.verificationUrl ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify`;

    const qrPayload = JSON.stringify({
      type: "DOCUMENT",
      verificationCode,
      verificationUrl,
    });

    const document = await prisma.document.create({
      data: {
        organizationId: session.organizationId,
        recipientId: recipient?.id || null,

        documentNumber,
        documentType,
        title,

        description: description || null,

        issueDate: new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,

        status:
          status === "DRAFT"
            ? "DRAFT"
            : status === "REVOKED"
              ? "REVOKED"
              : status === "EXPIRED"
                ? "EXPIRED"
                : "ISSUED",

        verificationCode,
        qrPayload,
      },

      include: {
        recipient: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: session.organizationId,
        action: "CREATE",
        entityType: "DOCUMENT",
        entityId: document.id,
        description: `Created document ${document.documentNumber}.`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Document created successfully.",
        document,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Documents POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create document.",
      },
      { status: 500 }
    );
  }
}