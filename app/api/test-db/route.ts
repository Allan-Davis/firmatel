import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const organizations = await prisma.organization.findMany({
      take: 5,
    });

    return Response.json({
      success: true,
      message: "Firmatel database connection successful.",
      organizations,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return Response.json(
      {
        success: false,
        message: "Firmatel database connection failed.",
      },
      { status: 500 }
    );
  }
}