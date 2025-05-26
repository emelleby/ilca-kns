"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { createUserProfile, ProfileData } from "./functions";
import { HomeLayout } from "@/app/layouts/HomeLayout";

interface ProfileSetupProps {
  user: any;
}

export default function ProfileSetup({ user }: ProfileSetupProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: "",
    experienceLevel: "",
    sailingExperience: "",
    certifications: [] as string[],
    boatInformation: {
      boatType: "",
      boatName: "",
      sailNumber: "",
      yearBuilt: "",
      manufacturer: "",
    },
    clubAffiliation: "",
    privacySettings: {
      showEmail: false,
      showLocation: true,
      showExperience: true,
      showBoatInfo: true,
      showActivity: true,
    },
  });

  const [newCertification, setNewCertification] = useState("");

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBoatInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      boatInformation: {
        ...prev.boatInformation,
        [field]: value,
      },
    }));
  };

  const handlePrivacyChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [field]: value,
      },
    }));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()],
      }));
      setNewCertification("");
    }
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const success = await createUserProfile(user.id, formData);
        if (success) {
          setResult("Profile created successfully!");
          // Redirect to profile view or home
          window.location.href = `/user/${user.id}/profile`;
        } else {
          setResult("Failed to create profile. Please try again.");
        }
      } catch (error) {
        console.error("Error creating profile:", error);
        setResult("An error occurred while creating your profile.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Tell us about yourself and your sailing experience to get the most out of ILCA KNS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Sailing Experience */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sailing Experience</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experienceLevel">Experience Level</Label>
                    <Select onValueChange={(value) => handleInputChange("experienceLevel", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert/Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sailingExperience">Years of Experience</Label>
                    <Input
                      id="sailingExperience"
                      value={formData.sailingExperience}
                      onChange={(e) => handleInputChange("sailingExperience", e.target.value)}
                      placeholder="e.g., 5 years, Since 2018"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clubAffiliation">Club Affiliation</Label>
                  <Input
                    id="clubAffiliation"
                    value={formData.clubAffiliation}
                    onChange={(e) => handleInputChange("clubAffiliation", e.target.value)}
                    placeholder="Your sailing club or organization"
                  />
                </div>

                {/* Certifications */}
                <div className="space-y-2">
                  <Label>Certifications</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      placeholder="Add a certification"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCertification())}
                    />
                    <Button type="button" onClick={addCertification} variant="outline">
                      Add
                    </Button>
                  </div>
                  {formData.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.certifications.map((cert, index) => (
                        <div key={index} className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          {cert}
                          <button
                            type="button"
                            onClick={() => removeCertification(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Boat Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Boat Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="boatType">Boat Type</Label>
                    <Input
                      id="boatType"
                      value={formData.boatInformation.boatType}
                      onChange={(e) => handleBoatInfoChange("boatType", e.target.value)}
                      placeholder="e.g., ILCA 7, ILCA 6"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="boatName">Boat Name</Label>
                    <Input
                      id="boatName"
                      value={formData.boatInformation.boatName}
                      onChange={(e) => handleBoatInfoChange("boatName", e.target.value)}
                      placeholder="Your boat's name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sailNumber">Sail Number</Label>
                    <Input
                      id="sailNumber"
                      value={formData.boatInformation.sailNumber}
                      onChange={(e) => handleBoatInfoChange("sailNumber", e.target.value)}
                      placeholder="Sail number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearBuilt">Year Built</Label>
                    <Input
                      id="yearBuilt"
                      value={formData.boatInformation.yearBuilt}
                      onChange={(e) => handleBoatInfoChange("yearBuilt", e.target.value)}
                      placeholder="Year"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={formData.boatInformation.manufacturer}
                      onChange={(e) => handleBoatInfoChange("manufacturer", e.target.value)}
                      placeholder="Boat manufacturer"
                    />
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Privacy Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Control what information is visible to other users on your public profile.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showEmail"
                      checked={formData.privacySettings.showEmail}
                      onCheckedChange={(checked) => handlePrivacyChange("showEmail", !!checked)}
                    />
                    <Label htmlFor="showEmail">Show email address</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showLocation"
                      checked={formData.privacySettings.showLocation}
                      onCheckedChange={(checked) => handlePrivacyChange("showLocation", !!checked)}
                    />
                    <Label htmlFor="showLocation">Show location</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showExperience"
                      checked={formData.privacySettings.showExperience}
                      onCheckedChange={(checked) => handlePrivacyChange("showExperience", !!checked)}
                    />
                    <Label htmlFor="showExperience">Show sailing experience and certifications</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showBoatInfo"
                      checked={formData.privacySettings.showBoatInfo}
                      onCheckedChange={(checked) => handlePrivacyChange("showBoatInfo", !!checked)}
                    />
                    <Label htmlFor="showBoatInfo">Show boat information</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showActivity"
                      checked={formData.privacySettings.showActivity}
                      onCheckedChange={(checked) => handlePrivacyChange("showActivity", !!checked)}
                    />
                    <Label htmlFor="showActivity">Show activity and posts</Label>
                  </div>
                </div>
              </div>

              {result && (
                <div className={`p-4 rounded-md ${result.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {result}
                </div>
              )}

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Creating Profile..." : "Complete Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
