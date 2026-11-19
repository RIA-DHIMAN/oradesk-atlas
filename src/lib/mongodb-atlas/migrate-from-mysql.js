require("./env");

const { PrismaClient: MysqlPrismaClient } = require("@prisma/client");
const { PrismaClient: AtlasPrismaClient } = require("@prisma/client-atlas");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set to read the current MySQL database.");
  }
  if (!process.env.MONGODB_ATLAS_URI) {
    throw new Error("MONGODB_ATLAS_URI must be set to write to MongoDB Atlas.");
  }

  const mysql = new MysqlPrismaClient();
  const atlas = new AtlasPrismaClient();

  try {
    const users = await mysql.user.findMany();
    const sessions = await mysql.session.findMany();
    const auditLogs = await mysql.auditLog.findMany();
    const documents = await mysql.document.findMany();
    const metadata = await mysql.metadata.findMany();

    for (const user of users) {
      const { id, ...userData } = user;
      await atlas.user.upsert({
        where: { id },
        update: userData,
        create: user,
      });
    }

    for (const session of sessions) {
      const { id, ...sessionData } = session;
      await atlas.session.upsert({
        where: { id },
        update: sessionData,
        create: session,
      });
    }

    for (const auditLog of auditLogs) {
      const { id, ...auditLogData } = auditLog;
      await atlas.auditLog.upsert({
        where: { id },
        update: auditLogData,
        create: auditLog,
      });
    }

    for (const document of documents) {
      await atlas.document.upsert({
        where: {
          collection_id: {
            collection: document.collection,
            id: document.id,
          },
        },
        update: {
          body: document.body,
          updatedAt: document.updatedAt,
        },
        create: {
          collection: document.collection,
          id: document.id,
          body: document.body,
          updatedAt: document.updatedAt,
        },
      });
    }

    for (const item of metadata) {
      await atlas.metadata.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: item,
      });
    }

    console.log(
      `Migration complete: ${users.length} users, ${sessions.length} sessions, ` +
        `${auditLogs.length} audit logs, ${documents.length} documents, and ` +
        `${metadata.length} metadata records copied to Atlas.`
    );
  } finally {
    await Promise.all([mysql.$disconnect(), atlas.$disconnect()]);
  }
}

main().catch((error) => {
  console.error("MySQL to MongoDB Atlas migration failed:", error);
  process.exitCode = 1;
});
