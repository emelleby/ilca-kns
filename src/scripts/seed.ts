import { defineScript } from "rwsdk/worker";
import { db, setupDb } from "@/db";
import { hashPassword } from "@/app/auth/password";

// Local development only: lets you log in as any seeded user
const SEED_PASSWORD = "password123";

export default defineScript(async ({ env }) => {
  // The worker middleware does not run for scripts, so set up the database here
  await setupDb(env);

  // Remove only the rows this script owns (fixed ids), so it can be re-run
  // without touching real accounts, profiles or passkeys.
  const seedUserIds = ["superuser-1", "user-1", "user-2", "user-3"];
  const seedOrgIds = ["org-1", "org-2", "org-3"];

  await db.comment.deleteMany({
    where: { OR: [{ userId: { in: seedUserIds } }, { post: { userId: { in: seedUserIds } } }] },
  });
  await db.post.deleteMany({
    where: { OR: [{ userId: { in: seedUserIds } }, { organizationId: { in: seedOrgIds } }] },
  });
  await db.passwordReset.deleteMany({ where: { userId: { in: seedUserIds } } });
  await db.credential.deleteMany({ where: { userId: { in: seedUserIds } } });
  await db.profile.deleteMany({ where: { userId: { in: seedUserIds } } });
  await db.organizationInvitation.deleteMany({ where: { organizationId: { in: seedOrgIds } } });
  await db.organizationMembership.deleteMany({
    where: { OR: [{ organizationId: { in: seedOrgIds } }, { userId: { in: seedUserIds } }] },
  });
  await db.organization.deleteMany({ where: { id: { in: seedOrgIds } } });
  await db.user.deleteMany({ where: { id: { in: seedUserIds } } });

  // Create test users
  const password = await hashPassword(SEED_PASSWORD);
  const superuser = await db.user.create({
    data: {
      id: "superuser-1",
      username: "superuser",
      email: "superuser@example.com",
      password,
      role: "SUPERUSER",
    },
  });

  const user1 = await db.user.create({
    data: {
      id: "user-1",
      username: "alice",
      email: "alice@example.com",
      password,
      role: "USER",
    },
  });

  const user2 = await db.user.create({
    data: {
      id: "user-2",
      username: "bob",
      email: "bob@example.com",
      password,
      role: "USER",
    },
  });

  const user3 = await db.user.create({
    data: {
      id: "user-3",
      username: "charlie",
      email: "charlie@example.com",
      password,
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


  // Posts covering every visibility level (see src/app/lib/postVisibility.ts)
  // org-1: alice = ADMIN, bob = MEMBER, charlie = COACH. org-2: alice = MEMBER, bob = ADMIN.
  const post = (
    data: {
      id: string;
      userId: string;
      organizationId: string | null;
      title: string;
      content: string;
      category?: string;
      imageUrl?: string;
      visibility: "PUBLIC" | "ORGANIZATION" | "COACH";
      status?: "DRAFT" | "PUBLISHED";
    },
    daysAgo: number,
  ) =>
    db.post.create({
      data: {
        ...data,
        status: data.status ?? "PUBLISHED",
        publishedAt: data.status === "DRAFT" ? null : new Date(Date.now() - daysAgo * 86400000),
      },
    });

  await post({
    id: "post-1",
    userId: user1.id,
    organizationId: org1.id,
    visibility: "PUBLIC",
    category: "Event",
    title: "Midsummer Patrol 2025 - registration open",
    content:
      "When: June 20 @ 16.45\n\nRegistration is open for the annual Midsummer Patrol. There will be three different groups and distances. For practical and safety reasons we have a limit of 180 participants.\n\nThis is a highlight of the year. Don't miss it!",
    imageUrl: "/images/photo-1506527240747-720a3e17b910.jfif",
  }, 1);

  await post({
    id: "post-2",
    userId: user2.id,
    organizationId: org1.id,
    visibility: "ORGANIZATION",
    category: "Training",
    title: "Perfect sailing conditions this weekend!",
    content:
      "Just got back from an amazing session at Fornebu. Wind was steady at 12-15 knots from the southwest, perfect for some upwind practice.\n\nAnyone else planning to get out there this weekend?",
    imageUrl: "/images/Helene.jpg",
  }, 2);

  await post({
    id: "post-3",
    userId: user3.id,
    organizationId: org1.id,
    visibility: "ORGANIZATION",
    category: "Training",
    title: "New ILCA 7 rigging tips from the pros",
    content:
      "Key takeaways from the rigging workshop:\n\n• Downhaul tension is crucial for upwind performance\n• Vang settings make a huge difference in waves\n• Adjust your outhaul for different conditions",
    imageUrl: "/images/photo-1605387202149-47169c4ea58a.jfif",
  }, 3);

  await post({
    id: "post-4",
    userId: user1.id,
    organizationId: org1.id,
    visibility: "PUBLIC",
    category: "News",
    title: "Club championship results are in!",
    content:
      "Congratulations to all participants in this year's club championship. See you all at the prize ceremony next Friday!",
  }, 4);

  await post({
    id: "post-5",
    userId: user2.id,
    organizationId: org1.id,
    visibility: "COACH",
    category: "Training",
    title: "Training diary: struggling upwind in waves",
    content:
      "Only visible to me and the coaches. Boat feels slow in 15+ knots, and I keep stalling in the waves. Would like feedback on my hiking position and sheet trim.",
  }, 5);

  await post({
    id: "post-6",
    userId: user2.id,
    organizationId: org2.id,
    visibility: "ORGANIZATION",
    category: "Event",
    title: "Ocean Racers: crew call for the autumn offshore race",
    content: "We are looking for two more crew members. Members of Ocean Racers only.",
  }, 6);

  await post({
    id: "post-7",
    userId: user1.id,
    organizationId: org1.id,
    visibility: "ORGANIZATION",
    status: "DRAFT",
    title: "Draft: winter training schedule",
    content: "Not published yet.",
  }, 0);

  console.log("🌱 Finished seeding");
  console.log("📊 Created:");
  console.log("  - 4 users (1 SUPERUSER, 3 regular users)");
  console.log("  - 3 organizations");
  console.log("  - 6 organization memberships");
  console.log("  - 7 posts (PUBLIC, ORGANIZATION, COACH, one draft)");
  console.log("🔑 Log in with any of superuser/alice/bob/charlie@example.com, password: " + SEED_PASSWORD);
});
