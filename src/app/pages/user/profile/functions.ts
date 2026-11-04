"use server";

import { db } from "@/db";
import { z } from "zod";
import { requireSelfOrSuperUser, requireUser } from "@/app/auth/guards";
import {
  applyProfilePrivacy,
  createProfileRecord,
  getUserProfile,
  hasUserProfile,
  type ProfileData,
} from "@/app/lib/profiles";

export type { ProfileData } from "@/app/lib/profiles";

// Every export here is a browser-callable endpoint. Each one starts with a guard.
// Server-only helpers (getUserProfile, autoCreateUserProfile, …) live in
// src/app/lib/profiles.ts. Policies: docs/security/server-function-authorization.md §4.3

const text = (max: number) => z.string().max(max).optional();
const profileDataSchema = z
  .object({
    name: text(100),
    bio: text(2000),
    location: text(200),
    experienceLevel: text(50),
    sailingExperience: text(200),
    certifications: z.array(z.string().max(200)).max(50).optional(),
    boatInformation: z
      .object({
        boatType: text(100),
        boatName: text(100),
        sailNumber: text(50),
        yearBuilt: text(10),
        manufacturer: text(100),
      })
      .optional(),
    clubAffiliation: text(200),
    privacySettings: z
      .object({
        showEmail: z.boolean().optional(),
        showLocation: z.boolean().optional(),
        showExperience: z.boolean().optional(),
        showBoatInfo: z.boolean().optional(),
        showActivity: z.boolean().optional(),
      })
      .optional(),
  })
  .strip();

// SELF: create the signed-in user's own profile.
export async function createUserProfile(profileData: ProfileData) {
  const user = requireUser();
  const data = profileDataSchema.parse(profileData);
  try {
    if (await hasUserProfile(user.id)) return null;
    return await createProfileRecord(user.id, data);
  } catch (error) {
    console.error("Error creating user profile:", error);
    return null;
  }
}

// SELF|SU
export async function updateUserProfile(userId: string, profileData: Partial<ProfileData>) {
  requireSelfOrSuperUser(userId);
  profileData = profileDataSchema.parse(profileData);

  try {
    const updateData: any = {};

    // Handle simple string fields
    if (profileData.name !== undefined) updateData.name = profileData.name;
    if (profileData.bio !== undefined) updateData.bio = profileData.bio;
    if (profileData.location !== undefined) updateData.location = profileData.location;
    if (profileData.experienceLevel !== undefined) updateData.experienceLevel = profileData.experienceLevel;
    if (profileData.sailingExperience !== undefined) updateData.sailingExperience = profileData.sailingExperience;
    if (profileData.clubAffiliation !== undefined) updateData.clubAffiliation = profileData.clubAffiliation;

    // Handle JSON fields
    if (profileData.certifications !== undefined) {
      updateData.certifications = JSON.stringify(profileData.certifications);
    }
    if (profileData.boatInformation !== undefined) {
      updateData.boatInformation = JSON.stringify(profileData.boatInformation);
    }
    if (profileData.privacySettings !== undefined) {
      updateData.privacySettings = JSON.stringify(profileData.privacySettings);
    }

    const profile = await db.profile.update({
      where: { userId },
      data: updateData,
    });

    return profile;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return null;
  }
}

// SELF|SU. Not used by the UI yet.
export async function deleteUserProfile(userId: string) {
  requireSelfOrSuperUser(userId);
  try {
    await db.profile.delete({
      where: { userId },
    });
    return true;
  } catch (error) {
    console.error("Error deleting user profile:", error);
    return false;
  }
}

// SESSION: view a profile as the signed-in user. Privacy is decided on the server from
// the session, never from an argument.
export async function getPublicProfile(userId: string) {
  const viewer = requireUser();
  try {
    const profile = await getUserProfile(z.string().min(1).max(100).parse(userId));
    if (!profile) return null;
    return applyProfilePrivacy(profile, viewer);
  } catch (error) {
    console.error("Error fetching public profile:", error);
    return null;
  }
}
