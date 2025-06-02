import { HomeLayout } from "@/app/layouts/HomeLayout";
import { RequestInfo } from "rwsdk/worker";
import { getOrCreateUserProfile } from "./functions";

import { db } from "@/db"; // Add db import

interface ProfilePageProps extends RequestInfo {
  UserId: string; // Changed from profileUserId
  isOwnProfile?: boolean;
}

export default async function ProfilePage({ UserId, isOwnProfile = false, ...props }: ProfilePageProps) {
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

  const profileUserName = user.username; // Now we have the ID
  const profileUserId = user.id; // Now we have the ID
  const currentUserId = props.ctx.user?.id;

  // Auto-create profile if it doesn't exist
  const profile = await getOrCreateUserProfile(profileUserId);

  if (!profile) {
    return (
      <HomeLayout {...props}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Profile Error</h1>
            <p className="text-muted-foreground">Unable to load or create profile. Please try again later.</p>
          </div>
        </div>
      </HomeLayout>
    );
  }

  // Apply privacy settings for public view
  const displayProfile = currentUserId === profileUserId ? profile : {
    ...profile,
    user: {
      ...profile.user,
      email: profile.privacySettings.showEmail ? profile.user.email : null,
    },
    location: profile.privacySettings.showLocation ? profile.location : null,
    experienceLevel: profile.privacySettings.showExperience ? profile.experienceLevel : null,
    sailingExperience: profile.privacySettings.showExperience ? (profile as any).sailingExperience : null,
    certifications: profile.privacySettings.showExperience ? profile.certifications : [],
    boatInformation: profile.privacySettings.showBoatInfo ? profile.boatInformation : {},
    clubAffiliation: profile.privacySettings.showExperience ? (profile as any).clubAffiliation : null,
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'long',
    });
  };

  // Cast to any to avoid type issues with new fields
  const displayProfileData = displayProfile as any;

  return (
    <HomeLayout {...props}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
              {(displayProfile.name || displayProfile.user.username)[0]?.toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">
                    {displayProfile.name || displayProfile.user.username}
                  </h1>
                  <p className="text-gray-600">@{displayProfile.user.username}</p>

                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {displayProfile.location && (
                      <span>📍 {displayProfile.location}</span>
                    )}
                    <span>📅 Joined {formatDate(displayProfile.user.createdAt)}</span>
                  </div>
                </div>

                {isOwnProfile && (
                  <a
                    href={`/user/${profileUserName}/profile/edit`}
                    className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                  >
                    Edit Profile
                  </a>
                )}
              </div>

              {displayProfile.bio && (
                <p className="mt-4 text-gray-700">{displayProfile.bio}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sailing Experience */}
          {(displayProfileData.experienceLevel || displayProfileData.sailingExperience || displayProfileData.certifications?.length > 0) && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                🏆 Sailing Experience
              </h2>
              <div className="space-y-4">
                {displayProfileData.experienceLevel && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Experience Level</p>
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm capitalize">
                      {displayProfileData.experienceLevel}
                    </span>
                  </div>
                )}

                {displayProfileData.sailingExperience && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Years of Experience</p>
                    <p>{displayProfileData.sailingExperience}</p>
                  </div>
                )}

                {displayProfileData.clubAffiliation && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Club Affiliation</p>
                    <p>{displayProfileData.clubAffiliation}</p>
                  </div>
                )}

                {displayProfileData.certifications?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {displayProfileData.certifications.map((cert: string, index: number) => (
                        <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Boat Information */}
          {displayProfile.boatInformation && Object.values(displayProfile.boatInformation).some((value: any) => value) && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                ⚓ Boat Information
              </h2>
              <div className="space-y-3">
                {displayProfile.boatInformation.boatType && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Boat Type</p>
                    <p>{displayProfile.boatInformation.boatType}</p>
                  </div>
                )}

                {displayProfile.boatInformation.boatName && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Boat Name</p>
                    <p>{displayProfile.boatInformation.boatName}</p>
                  </div>
                )}

                {displayProfile.boatInformation.sailNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sail Number</p>
                    <p>{displayProfile.boatInformation.sailNumber}</p>
                  </div>
                )}

                {displayProfile.boatInformation.manufacturer && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Manufacturer</p>
                    <p>{displayProfile.boatInformation.manufacturer}</p>
                  </div>
                )}

                {displayProfile.boatInformation.yearBuilt && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Year Built</p>
                    <p>{displayProfile.boatInformation.yearBuilt}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Activity Statistics - Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Activity</h2>
          <p className="text-gray-600">Activity tracking will be implemented in future updates.</p>
        </div>
      </div>
    </HomeLayout>
  );
}
