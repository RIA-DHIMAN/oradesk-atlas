require("./env");

const { PrismaClient } = require("@prisma/client-atlas");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  if (!process.env.MONGODB_ATLAS_URI) {
    throw new Error("MONGODB_ATLAS_URI must be set before seeding MongoDB Atlas.");
  }

  const adminLogin = process.env.SUPER_ADMIN_LOGIN;
  const adminPass = process.env.SUPER_ADMIN_PASSWORD;

  if (!adminLogin || !adminPass) {
    throw new Error("SUPER_ADMIN_LOGIN and SUPER_ADMIN_PASSWORD must be set before seeding.");
  }

  const adminHash = await bcrypt.hash(adminPass, 10);
  const admin = await prisma.user.upsert({
    where: { loginId: adminLogin },
    update: {
      plainPasscode: adminPass,
      passcodeHash: adminHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      name: "Master Super Admin",
      loginId: adminLogin,
      role: "SUPER_ADMIN",
      plainPasscode: adminPass,
      passcodeHash: adminHash,
      isActive: true,
    },
  });

  await prisma.metadata.upsert({
    where: { key: "revision" },
    update: {},
    create: { key: "revision", value: "1" },
  });

  const defaultSettings = {
    clinic: {
      name: "OraDesk Clinic",
      doctor: "Dr. Lead Specialist",
      phone: "+91 98765 43210",
      email: "clinic@oradesk.local",
      address: "Suite 101, Medical Enclave",
      cur: "₹",
    },
    chairs: ["Chair 1", "Chair 2"],
    dayStart: 9,
    dayEnd: 19,
    fees: {
      Consultation: 500,
      "Root Canal Treatment": 3500,
      "Composite Restoration": 1200,
      "Scaling & Polishing": 1000,
      "Crown / Ceramic": 4500,
      "Botox 20 Units": 8000,
      "Dermal Filler 1ml": 14000,
    },
  };

  await prisma.document.upsert({
    where: {
      collection_id: {
        collection: "settings",
        id: "clinic",
      },
    },
    update: {},
    create: {
      collection: "settings",
      id: "clinic",
      body: JSON.stringify(defaultSettings),
    },
  });

  console.log(`MongoDB Atlas seeded for admin login "${admin.loginId}".`);
}

main()
  .catch((error) => {
    console.error("MongoDB Atlas seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
