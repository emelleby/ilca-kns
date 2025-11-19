import { defineScript } from "rwsdk/worker";
import { db } from "@/db";

/**
 * Syncs data from production Cloudflare D1 to local database
 * Usage: pnpm worker:run ./src/scripts/sync-from-production.ts
 * 
 * This script:
 * 1. Clears all local data
 * 2. Fetches data from production D1
 * 3. Inserts it into local database
 */

export default defineScript(async (env: Env) => {
  console.log("🔄 Starting sync from production D1 to local database...");

  try {
    // Step 1: Clear local data (in reverse order of dependencies)
    console.log("🗑️  Clearing local data...");
    await db.$executeRawUnsafe(`
      DELETE FROM OrganizationInvitation;
      DELETE FROM PasswordReset;
      DELETE FROM Comment;
      DELETE FROM Post;
      DELETE FROM OrganizationMembership;
      DELETE FROM Organization;
      DELETE FROM Credential;
      DELETE FROM Profile;
      DELETE FROM User;
    `);
    console.log("✅ Local data cleared");

    // Step 2: Fetch data from production
    console.log("📥 Fetching data from production...");
    
    const users = await env.DB.prepare("SELECT * FROM User").all();
    const profiles = await env.DB.prepare("SELECT * FROM Profile").all();
    const credentials = await env.DB.prepare("SELECT * FROM Credential").all();
    const organizations = await env.DB.prepare("SELECT * FROM Organization").all();
    const memberships = await env.DB.prepare("SELECT * FROM OrganizationMembership").all();
    const posts = await env.DB.prepare("SELECT * FROM Post").all();
    const comments = await env.DB.prepare("SELECT * FROM Comment").all();
    const passwordResets = await env.DB.prepare("SELECT * FROM PasswordReset").all();
    const invitations = await env.DB.prepare("SELECT * FROM OrganizationInvitation").all();

    console.log(`📊 Found ${users.results.length} users`);
    console.log(`📊 Found ${profiles.results.length} profiles`);
    console.log(`📊 Found ${credentials.results.length} credentials`);
    console.log(`📊 Found ${organizations.results.length} organizations`);
    console.log(`📊 Found ${memberships.results.length} memberships`);
    console.log(`📊 Found ${posts.results.length} posts`);
    console.log(`📊 Found ${comments.results.length} comments`);
    console.log(`📊 Found ${passwordResets.results.length} password resets`);
    console.log(`📊 Found ${invitations.results.length} invitations`);

    // Step 3: Insert data into local database
    console.log("📤 Inserting data into local database...");

    // Insert users
    for (const user of users.results) {
      await db.user.create({
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          password: user.password,
          club: user.club,
          role: user.role,
          createdAt: new Date(user.createdAt),
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : null,
        },
      });
    }
    console.log(`✅ Inserted ${users.results.length} users`);

    // Insert profiles
    for (const profile of profiles.results) {
      await db.profile.create({
        data: {
          id: profile.id,
          userId: profile.userId,
          name: profile.name,
          bio: profile.bio,
          location: profile.location,
          experienceLevel: profile.experienceLevel,
          profilePicture: profile.profilePicture,
          privacySettings: profile.privacySettings,
          sailingExperience: profile.sailingExperience,
          certifications: profile.certifications,
          boatInformation: profile.boatInformation,
          clubAffiliation: profile.clubAffiliation,
          createdAt: new Date(profile.createdAt),
          updatedAt: new Date(profile.updatedAt),
        },
      });
    }
    console.log(`✅ Inserted ${profiles.results.length} profiles`);

    // Insert credentials
    for (const cred of credentials.results) {
      await db.credential.create({
        data: {
          id: cred.id,
          userId: cred.userId,
          deviceName: cred.deviceName,
          credentialId: cred.credentialId,
          publicKey: Buffer.from(cred.publicKey),
          counter: cred.counter,
          createdAt: new Date(cred.createdAt),
        },
      });
    }
    console.log(`✅ Inserted ${credentials.results.length} credentials`);

    // Insert organizations
    for (const org of organizations.results) {
      await db.organization.create({
        data: {
          id: org.id,
          name: org.name,
          description: org.description,
          createdAt: new Date(org.createdAt),
          updatedAt: new Date(org.updatedAt),
        },
      });
    }
    console.log(`✅ Inserted ${organizations.results.length} organizations`);

    // Insert memberships
    for (const membership of memberships.results) {
      await db.organizationMembership.create({
        data: {
          id: membership.id,
          userId: membership.userId,
          organizationId: membership.organizationId,
          role: membership.role,
          joinedAt: new Date(membership.joinedAt),
        },
      });
    }
    console.log(`✅ Inserted ${memberships.results.length} memberships`);

    // Insert posts
    for (const post of posts.results) {
      await db.post.create({
        data: {
          id: post.id,
          userId: post.userId,
          title: post.title,
          content: post.content,
          category: post.category,
          status: post.status,
          publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
          createdAt: new Date(post.createdAt),
          updatedAt: new Date(post.updatedAt),
        },
      });
    }
    console.log(`✅ Inserted ${posts.results.length} posts`);

    // Insert comments
    for (const comment of comments.results) {
      await db.comment.create({
        data: {
          id: comment.id,
          userId: comment.userId,
          postId: comment.postId,
          content: comment.content,
          createdAt: new Date(comment.createdAt),
        },
      });
    }
    console.log(`✅ Inserted ${comments.results.length} comments`);

    // Insert password resets
    for (const reset of passwordResets.results) {
      await db.passwordReset.create({
        data: {
          id: reset.id,
          userId: reset.userId,
          token: reset.token,
          expires: new Date(reset.expires),
          createdAt: new Date(reset.createdAt),
        },
      });
    }
    console.log(`✅ Inserted ${passwordResets.results.length} password resets`);

    // Insert invitations
    for (const invitation of invitations.results) {
      await db.organizationInvitation.create({
        data: {
          id: invitation.id,
          email: invitation.email,
          organizationId: invitation.organizationId,
          role: invitation.role,
          status: invitation.status,
          token: invitation.token,
          expiresAt: new Date(invitation.expiresAt),
          createdAt: new Date(invitation.createdAt),
          createdBy: invitation.createdBy,
          acceptedAt: invitation.acceptedAt ? new Date(invitation.acceptedAt) : null,
        },
      });
    }
    console.log(`✅ Inserted ${invitations.results.length} invitations`);

    console.log("✨ Sync completed successfully!");
    console.log("📊 Summary:");
    console.log(`  - ${users.results.length} users`);
    console.log(`  - ${profiles.results.length} profiles`);
    console.log(`  - ${credentials.results.length} credentials`);
    console.log(`  - ${organizations.results.length} organizations`);
    console.log(`  - ${memberships.results.length} memberships`);
    console.log(`  - ${posts.results.length} posts`);
    console.log(`  - ${comments.results.length} comments`);
    console.log(`  - ${passwordResets.results.length} password resets`);
    console.log(`  - ${invitations.results.length} invitations`);
  } catch (error) {
    console.error("❌ Sync failed:", error);
    throw error;
  }
});

