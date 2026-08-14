import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    const recipients = await prisma.recipient.findMany({
      where: {
        organizationId: session.organizationId,
      },
      orderBy: {
        fullName: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      recipients,
    });
  } catch (error) {
    console.error("Get recipients error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve recipients.",
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

    const fullName = String(
      body.fullName || ""
    ).trim();

    const email =
      body.email !== undefined &&
      body.email !== null &&
      String(body.email).trim() !== ""
        ? String(body.email).trim().toLowerCase()
        : null;

    const phone =
      body.phone !== undefined &&
      body.phone !== null &&
      String(body.phone).trim() !== ""
        ? String(body.phone).trim()
        : null;

    const identifier =
      body.identifier !== undefined &&
      body.identifier !== null &&
      String(body.identifier).trim() !== ""
        ? String(body.identifier).trim()
        : null;

    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          message: "Recipient name is required.",
        },
        { status: 400 }
      );
    }

    const recipient =
      await prisma.recipient.create({
        data: {
          organizationId:
            session.organizationId,

          fullName,
          email,
          phone,
          identifier,
        },
      });

    await prisma.auditLog.create({
      data: {
        organizationId:
          session.organizationId,

        action: "CREATE",
        entityType: "RECIPIENT",
        entityId: recipient.id,

        description: `Created recipient ${recipient.fullName}`,

        ipAddress:
          request.headers.get(
            "x-forwarded-for"
          ) ||
          request.headers.get(
            "x-real-ip"
          ) ||
          null,

        userAgent:
          request.headers.get(
            "user-agent"
          ) || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Recipient created successfully.",
        recipient,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create recipient error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create recipient.",
      },
      { status: 500 }
    );
  }
}