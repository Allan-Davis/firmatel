import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        organizationId: session.organizationId,
      },

      include: {
        recipient: true,
        organization: true,
        verificationEvents: {
          orderBy: {
            verifiedAt: "desc",
          },
          take: 20,
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          message: "Document not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("Document GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve document.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.document.findFirst({
      where: {
        id,
        organizationId: session.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Document not found.",
        },
        { status: 404 }
      );
    }

    const data: {
      title?: string;
      documentType?: string;
      description?: string | null;
      recipientId?: string | null;
      expiryDate?: Date | null;
      status?: "DRAFT" | "ISSUED" | "REVOKED" | "EXPIRED";
    } = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();

      if (!title) {
        return NextResponse.json(
          {
            success: false,
            message: "Document title cannot be empty.",
          },
          { status: 400 }
        );
      }

      data.title = title;
    }

    if (body.documentType !== undefined) {
      const documentType = String(body.documentType).trim();

      if (!documentType) {
        return NextResponse.json(
          {
            success: false,
            message: "Document type cannot be empty.",
          },
          { status: 400 }
        );
      }

      data.documentType = documentType;
    }

    if (body.description !== undefined) {
      data.description =
        String(body.description).trim() || null;
    }

    if (body.expiryDate !== undefined) {
      data.expiryDate = body.expiryDate
        ? new Date(body.expiryDate)
        : null;
    }

    if (body.status !== undefined) {
      const allowedStatuses = [
        "DRAFT",
        "ISSUED",
        "REVOKED",
        "EXPIRED",
      ];

      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid document status.",
          },
          { status: 400 }
        );
      }

      data.status = body.status;
    }

    if (body.recipientId !== undefined) {
      const recipientId = String(body.recipientId).trim();

      if (recipientId) {
        const recipient = await prisma.recipient.findFirst({
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

        data.recipientId = recipient.id;
      } else {
        data.recipientId = null;
      }
    }

    const document = await prisma.document.update({
      where: {
        id,
      },

      data,

      include: {
        recipient: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: session.organizationId,
        action: "UPDATE",
        entityType: "DOCUMENT",
        entityId: document.id,
        description: `Updated document ${document.documentNumber}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document updated successfully.",
      document,
    });
  } catch (error) {
    console.error("Document PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update document.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const existing = await prisma.document.findFirst({
      where: {
        id,
        organizationId: session.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Document not found.",
        },
        { status: 404 }
      );
    }

    await prisma.auditLog.create({
      data: {
        organizationId: session.organizationId,
        action: "DELETE",
        entityType: "DOCUMENT",
        entityId: existing.id,
        description: `Deleted document ${existing.documentNumber}.`,
      },
    });

    await prisma.document.delete({
      where: {
        id: existing.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully.",
    });
  } catch (error) {
    console.error("Document DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete document.",
      },
      { status: 500 }
    );
  }
}