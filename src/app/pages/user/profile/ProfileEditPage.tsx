import { db } from "@/db";
import { RequestInfo } from "rwsdk/worker";
import { HomeLayout } from "@/app/layouts/HomeLayout";
import { SimpleProfileEditForm } from "@/app/components/ProfileEditForm";
import { getOrCreateUserProfile } from "./functions";

interface ProfileEditPageProps extends RequestInfo {
  UserId: string;
  isOwnProfile: boolean;
}

export default async function ProfileEditPage({ UserId, isOwnProfile, ...props }: ProfileEditPageProps) {
  // Only allow users to edit their own profile
  if (!isOwnProfile) {
    return (
      <HomeLayout {...props}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">You can only edit your own profile.</p>
          </div>
        </div>
      </HomeLayout>
    );
  }

  // Fetch user by id to get their Profile
  const user = await db.user.findUnique({
    where: { id: UserId },
    include: { profile: true },
  });

  if (!user) {
    return (
      <HomeLayout {...props}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <p className="text-muted-foreground">The profile you are looking for does not exist.</p>
          </div>
        </div>
      </HomeLayout>
    );
  }

  // Get or create profile
  const profile = await getOrCreateUserProfile(UserId);

  if (!profile) {
    return (
      <HomeLayout {...props}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Profile Error</h1>
            <p className="text-muted-foreground">Unable to load or create profile.</p>
          </div>
        </div>
      </HomeLayout>
    );
  }

  // Prepare profile data for the client component
  const profileData = {
    id: profile.id,
    name: profile.name || "",
    bio: profile.bio || "",
    location: profile.location || "",
    experienceLevel: profile.experienceLevel || "",
    sailingExperience: profile.sailingExperience || "",
    certifications: profile.certifications || [],
    boatInformation: profile.boatInformation || {
      boatType: "",
      boatName: "",
      sailNumber: "",
      yearBuilt: "",
      manufacturer: "",
    },
    clubAffiliation: profile.clubAffiliation || "",
    privacySettings: profile.privacySettings || {
      showEmail: false,
      showLocation: true,
      showExperience: true,
      showBoatInfo: true,
      showActivity: true,
    },
    profilePicture: profile.profilePicture || "",
  };

  // The client component will handle navigation after success

  return (
    <HomeLayout {...props}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update your sailing profile information
          </p>
        </div>

        {/* Profile Edit Form */}
        <SimpleProfileEditForm
          profile={profileData}
          userId={UserId}
          username={user.username}
        />
      </div>
    </HomeLayout>
  );
}
