"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { getPublicProfile } from "./functions";
import { HomeLayout } from "@/app/layouts/HomeLayout";
import { MapPin, Calendar, Award, Anchor } from "lucide-react";

interface ProfileViewProps {
  profileUserId: string;
  isOwnProfile?: boolean;
  currentUserId?: string;
}

export default function ProfileView({ profileUserId, isOwnProfile = false, currentUserId }: ProfileViewProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileData = await getPublicProfile(profileUserId, currentUserId);

        if (!profileData) {
          setError("Profile not found");
          return;
        }

        setProfile(profileData);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [profileUserId, currentUserId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">{error || "Profile not found"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.profilePicture} alt={profile.name || profile.user.username} />
                <AvatarFallback className="text-2xl">
                  {(profile.name || profile.user.username)[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold">
                      {profile.name || profile.user.username}
                    </h1>
                    <p className="text-muted-foreground">@{profile.user.username}</p>

                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {profile.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {profile.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Joined {formatDate(profile.user.createdAt)}
                      </div>
                    </div>
                  </div>

                  {isOwnProfile && (
                    <Button asChild>
                      <a href={`/user/${profileUserId}/profile/edit`}>Edit Profile</a>
                    </Button>
                  )}
                </div>

                {profile.bio && (
                  <p className="mt-4 text-gray-700">{profile.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sailing Experience */}
          {(profile.experienceLevel || profile.sailingExperience || profile.certifications?.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Sailing Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.experienceLevel && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Experience Level</p>
                    <Badge variant="secondary" className="capitalize">
                      {profile.experienceLevel}
                    </Badge>
                  </div>
                )}

                {profile.sailingExperience && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Years of Experience</p>
                    <p>{profile.sailingExperience}</p>
                  </div>
                )}

                {profile.clubAffiliation && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Club Affiliation</p>
                    <p>{profile.clubAffiliation}</p>
                  </div>
                )}

                {profile.certifications?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.certifications.map((cert: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Boat Information */}
          {profile.boatInformation && Object.values(profile.boatInformation).some(value => value) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Anchor className="w-5 h-5" />
                  Boat Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.boatInformation.boatType && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Boat Type</p>
                    <p>{profile.boatInformation.boatType}</p>
                  </div>
                )}

                {profile.boatInformation.boatName && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Boat Name</p>
                    <p>{profile.boatInformation.boatName}</p>
                  </div>
                )}

                {profile.boatInformation.sailNumber && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sail Number</p>
                    <p>{profile.boatInformation.sailNumber}</p>
                  </div>
                )}

                {profile.boatInformation.manufacturer && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Manufacturer</p>
                    <p>{profile.boatInformation.manufacturer}</p>
                  </div>
                )}

                {profile.boatInformation.yearBuilt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Year Built</p>
                    <p>{profile.boatInformation.yearBuilt}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity Statistics - Placeholder for future implementation */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Recent activity and statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Activity tracking will be implemented in future updates.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
