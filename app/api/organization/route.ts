import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: {
        id: session.organizationId,
      },
      include: {
        settings: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, message: "Organization not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error("Organization GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load organization.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    if (
      session.role !== "SUPER_ADMIN" &&
      session.role !== "ORGANIZATION_ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to update organization settings.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const organization = await prisma.organization.update({
      where: {
        id: session.organizationId,
      },
      data: {
        name:
          body.name !== undefined
            ? String(body.name).trim()
            : undefined,

        type:
          body.type !== undefined
            ? body.type
            : undefined,

        email:
          body.email !== undefined
            ? String(body.email).trim() || null
            : undefined,

        phone:
          body.phone !== undefined
            ? String(body.phone).trim() || null
            : undefined,

        website:
          body.website !== undefined
            ? String(body.website).trim() || null
            : undefined,

        address:
          body.address !== undefined
            ? String(body.address).trim() || null
            : undefined,

        logoUrl:
          body.logoUrl !== undefined
            ? String(body.logoUrl).trim() || null
            : undefined,

        primaryColor:
          body.primaryColor !== undefined
            ? String(body.primaryColor).trim() || null
            : undefined,

        secondaryColor:
          body.secondaryColor !== undefined
            ? String(body.secondaryColor).trim() || null
            : undefined,

        documentPrefix:
          body.documentPrefix !== undefined
            ? String(body.documentPrefix).trim() || null
            : undefined,

        verificationUrl:
          body.verificationUrl !== undefined
            ? String(body.verificationUrl).trim() || null
            : undefined,
      },
    });

    await prisma.organizationSetting.upsert({
      where: {
        organizationId: session.organizationId,
      },
      create: {
        organizationId: session.organizationId,
        timezone: body.timezone || "Africa/Nairobi",
        dateFormat: body.dateFormat || "DD/MM/YYYY",
        defaultDocumentValidityDays:
          body.defaultDocumentValidityDays
            ? Number(body.defaultDocumentValidityDays)
            : null,
        requireQrVerification:
          body.requireQrVerification ?? true,
        requireRecipientEmail:
          body.requireRecipientEmail ?? false,
        requireRecipientPhone:
          body.requireRecipientPhone ?? false,
        allowPublicVerification:
          body.allowPublicVerification ?? true,
      },
      update: {
        timezone:
          body.timezone !== undefined
            ? String(body.timezone)
            : undefined,

        dateFormat:
          body.dateFormat !== undefined
            ? String(body.dateFormat)
            : undefined,

        defaultDocumentValidityDays:
          body.defaultDocumentValidityDays !== undefined
            ? body.defaultDocumentValidityDays
              ? Number(body.defaultDocumentValidityDays)
              : null
            : undefined,

        requireQrVerification:
          body.requireQrVerification !== undefined
            ? Boolean(body.requireQrVerification)
            : undefined,

        requireRecipientEmail:
          body.requireRecipientEmail !== undefined
            ? Boolean(body.requireRecipientEmail)
            : undefined,

        requireRecipientPhone:
          body.requireRecipientPhone !== undefined
            ? Boolean(body.requireRecipientPhone)
            : undefined,

        allowPublicVerification:
          body.allowPublicVerification !== undefined
            ? Boolean(body.allowPublicVerification)
            : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Organization updated successfully.",
      organization,
    });
  } catch (error) {
    console.error("Organization PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update organization.",
      },
      { status: 500 }
    );
  }
}