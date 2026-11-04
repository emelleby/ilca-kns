import { db } from "@/db";

// Server-only profile helpers. Not a "use server" file: nothing here is callable from
// the browser. Callers (server components, guarded server functions, registration) are
// responsible for authorization.

// Types for profile data
export interface ProfileData {
  name?: string;
  bio?: string;
  location?: string;
  experienceLevel?: string;
  sailingExperience?: string;
  certifications?: string[];
  boatInformation?: {
    boatType?: string;
    boatName?: string;
    sailNumber?: string;
    yearBuilt?: string;
    manufacturer?: string;
  };
  clubAffiliation?: string;
  privacySettings?: {
    showEmail?: boolean;
    showLocation?: boolean;
    showExperience?: boolean;
    showBoatInfo?: boolean;
    showActivity?: boolean;
  };
}

// Get user profile by user ID
export async function getUserProfile(userId: string) {
  try {
    const profile = await db.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      return null;
    }

    // Parse JSON fields
    const parsedProfile = {
      ...profile,
      certifications: profile.certifications ? JSON.parse(profile.certifications) : [],
      boatInformation: profile.boatInformation ? JSON.parse(profile.boatInformation) : {},
      privacySettings: profile.privacySettings ? JSON.parse(profile.privacySettings) : {
        showEmail: false,
        showLocation: true,
        showExperience: true,
        showBoatInfo: true,
        showActivity: true,
      },
    };

    return parsedProfile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

// Create a new profile for a user
export async function createProfileRecord(userId: string, profileData: ProfileData) {
  try {
    const profile = await db.profile.create({
      data: {
        userId,
        name: profileData.name,
        bio: profileData.bio,
        location: profileData.location,
        experienceLevel: profileData.experienceLevel,
        sailingExperience: profileData.sailingExperience,
        certifications: profileData.certifications ? JSON.stringify(profileData.certifications) : null,
        boatInformation: profileData.boatInformation ? JSON.stringify(profileData.boatInformation) : null,
        clubAffiliation: profileData.clubAffiliation,
        privacySettings: profileData.privacySettings ? JSON.stringify(profileData.privacySettings) : JSON.stringify({
          showEmail: false,
          showLocation: true,
          showExperience: true,
          showBoatInfo: true,
          showActivity: true,
        }),
      },
    });

    return profile;
  } catch (error) {
    console.error("Error creating user profile:", error);
    return null;
  }
}

// Check if user has a profile
export async function hasUserProfile(userId: string) {
  try {
    const profile = await db.profile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return !!profile;
  } catch (error) {
    console.error("Error checking user profile:", error);
    return false;
  }
}

// Auto-create a basic profile for a user with available information
export async function autoCreateUserProfile(userId: string) {
  try {
    // First check if profile already exists
    const existingProfile = await hasUserProfile(userId);
    if (existingProfile) {
      return await getUserProfile(userId);
    }

    // Get user information to populate the profile
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        club: true,
      },
    });

    if (!user) {
      console.error("User not found for auto-profile creation:", userId);
      return null;
    }

    // Create a basic profile with available user information
    const profileData: ProfileData = {
      name: user.username, // Use username as initial name
      bio: "",
      location: "",
      experienceLevel: "",
      sailingExperience: "",
      certifications: [],
      boatInformation: {
        boatType: "",
        boatName: "",
        sailNumber: "",
        yearBuilt: "",
        manufacturer: "",
      },
      clubAffiliation: user.club || "", // Use club from user if available
      privacySettings: {
        showEmail: false,
        showLocation: true,
        showExperience: true,
        showBoatInfo: true,
        showActivity: true,
      },
    };

    const profile = await createProfileRecord(userId, profileData);
    if (profile) {
      console.log("Auto-created profile for user:", userId);
      return await getUserProfile(userId); // Return the full profile with parsed fields
    }

    return null;
  } catch (error) {
    console.error("Error auto-creating user profile:", error);
    return null;
  }
}

// Get user profile, auto-creating if it doesn't exist
export async function getOrCreateUserProfile(userId: string) {
  try {
    let profile = await getUserProfile(userId);

    if (!profile) {
      profile = await autoCreateUserProfile(userId);
    }

    return profile;
  } catch (error) {
    console.error("Error getting or creating user profile:", error);
    return null;
  }
}

// Apply the owner's privacy settings. Only the owner sees everything (SUPERUSER gets no
// special view, same as for posts).
export function applyProfilePrivacy<P extends NonNullable<Awaited<ReturnType<typeof getUserProfile>>>>(
  profile: P,
  viewer: { id: string } | null | undefined,
): P {
  if (viewer && viewer.id === profile.userId) {
    return profile;
  }
  const privacy = profile.privacySettings;
  return {
    ...profile,
    user: {
      ...profile.user,
      email: privacy.showEmail ? profile.user.email : null,
    },
    location: privacy.showLocation ? profile.location : null,
    experienceLevel: privacy.showExperience ? profile.experienceLevel : null,
    sailingExperience: privacy.showExperience ? profile.sailingExperience : null,
    certifications: privacy.showExperience ? profile.certifications : [],
    boatInformation: privacy.showBoatInfo ? profile.boatInformation : {},
    clubAffiliation: privacy.showExperience ? profile.clubAffiliation : null,
  };
}
