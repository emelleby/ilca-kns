import { defineScript } from "rwsdk/worker";
import { db } from "@/db";

export default defineScript(async () => {
  // Clean up existing data
  await db.$executeRawUnsafe(`\
    DELETE FROM OrganizationInvitation;
    DELETE FROM OrganizationMembership;
    DELETE FROM Organization;
    DELETE FROM User;
    DELETE FROM sqlite_sequence;
  `);

  // Create test users
  const superuser = await db.user.create({
    data: {
      id: "superuser-1",
      username: "superuser",
      email: "superuser@example.com",
      role: "SUPERUSER",
    },
  });

  const user1 = await db.user.create({
    data: {
      id: "user-1",
      username: "alice",
      email: "alice@example.com",
      role: "USER",
    },
  });

  const user2 = await db.user.create({
    data: {
      id: "user-2",
      username: "bob",
      email: "bob@example.com",
      role: "USER",
    },
  });

  const user3 = await db.user.create({
    data: {
      id: "user-3",
      username: "charlie",
      email: "charlie@example.com",
      role: "USER",
    },
  });

  // Create test organizations
  const org1 = await db.organization.create({
    data: {
      id: "org-1",
      name: "Sailing Club Norway",
      description: "Premier sailing club in Norway with competitive racing programs",
    },
  });

  const org2 = await db.organization.create({
    data: {
      id: "org-2",
      name: "Ocean Racers",
      description: "High-performance ocean racing team",
    },
  });

  const org3 = await db.organization.create({
    data: {
      id: "org-3",
      name: "Youth Sailing Academy",
      description: "Training young sailors for competitive sailing",
    },
  });

  // Create organization memberships
  await db.organizationMembership.create({
    data: {
      userId: user1.id,
      organizationId: org1.id,
      role: "ADMIN",
    },
  });

  await db.organizationMembership.create({
    data: {
      userId: user2.id,
      organizationId: org1.id,
      role: "MEMBER",
    },
  });

  await db.organizationMembership.create({
    data: {
      userId: user3.id,
      organizationId: org1.id,
      role: "COACH",
    },
  });

  await db.organizationMembership.create({
    data: {
      userId: user1.id,
      organizationId: org2.id,
      role: "MEMBER",
    },
  });

  await db.organizationMembership.create({
    data: {
      userId: user2.id,
      organizationId: org2.id,
      role: "ADMIN",
    },
  });

  await db.organizationMembership.create({
    data: {
      userId: user3.id,
      organizationId: org3.id,
      role: "ADMIN",
    },
  });

  console.log("🌱 Finished seeding");
  console.log("📊 Created:");
  console.log("  - 4 users (1 SUPERUSER, 3 regular users)");
  console.log("  - 3 organizations");
  console.log("  - 6 organization memberships");
  console.log("🔑 SUPERUSER login: superuser@example.com");
});
