import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "firmatel",
  connectionLimit: 5,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const organization = await prisma.organization.upsert({
    where: {
      slug: "firmatel",
    },
    update: {},
    create: {
      name: "Firmatel",
      slug: "firmatel",
      email: "admin@firmatel.local",
      status: "ACTIVE",
    },
  });

  const password = "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: "admin@firmatel.local",
      },
    },
    update: {
      passwordHash,
      role: "ORGANIZATION_ADMIN",
      status: "ACTIVE",
    },
    create: {
      organizationId: organization.id,
      name: "Firmatel Administrator",
      email: "admin@firmatel.local",
      passwordHash,
      role: "ORGANIZATION_ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("Firmatel administrator created successfully.");
  console.log("Organization:", organization.name);
  console.log("Admin:", admin.email);
  console.log("Temporary password:", password);
}

main()
  .catch((error) => {
    console.error("Failed to create administrator:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
