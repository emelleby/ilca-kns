"use client";

import { useState } from "react";
import { updateUserProfile } from "@/app/pages/user/profile/functions";

interface ProfileData {
  id: string;
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
  profilePicture?: string;
}

interface SimpleProfileEditFormProps {
  profile: ProfileData;
  userId: string;
  username: string;
}

export function SimpleProfileEditForm({ profile, userId, username }: SimpleProfileEditFormProps) {
  const [formData, setFormData] = useState<ProfileData>({
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
  });

  const [certificationInput, setCertificationInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBoatInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      boatInformation: {
        ...prev.boatInformation,
        [field]: value
      }
    }));
  };

  const handlePrivacyChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [field]: value
      }
    }));
  };

  const addCertification = () => {
    if (certificationInput.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...(prev.certifications || []), certificationInput.trim()]
      }));
      setCertificationInput("");
    }
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Call the server function to update the profile
      const result = await updateUserProfile(userId, {
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        experienceLevel: formData.experienceLevel,
        sailingExperience: formData.sailingExperience,
        certifications: formData.certifications,
        boatInformation: formData.boatInformation,
        clubAffiliation: formData.clubAffiliation,
        privacySettings: formData.privacySettings,
      });

      if (result) {
        alert("Profile updated successfully!");
        // Navigate back to profile view
        window.location.href = `/user/${username}/profile`;
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your full name"
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell us about yourself"
                rows={3}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="City, Country"
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label htmlFor="clubAffiliation" className="block text-sm font-medium mb-1">Club Affiliation</label>
              <input
                type="text"
                id="clubAffiliation"
                value={formData.clubAffiliation}
                onChange={(e) => handleInputChange("clubAffiliation", e.target.value)}
                placeholder="Your sailing club"
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Sailing Experience */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Sailing Experience</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="experienceLevel" className="block text-sm font-medium mb-1">Experience Level</label>
              <select
                id="experienceLevel"
                value={formData.experienceLevel}
                onChange={(e) => handleInputChange("experienceLevel", e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select your experience level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div>
              <label htmlFor="sailingExperience" className="block text-sm font-medium mb-1">Sailing Experience Details</label>
              <textarea
                id="sailingExperience"
                value={formData.sailingExperience}
                onChange={(e) => handleInputChange("sailingExperience", e.target.value)}
                placeholder="Describe your sailing experience"
                rows={3}
                className="w-full p-2 border rounded-md"
              />
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium mb-1">Certifications</label>
              <div className="space-y-2">
                {formData.certifications?.map((cert, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>{cert}</span>
                    <button
                      type="button"
                      onClick={() => removeCertification(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={certificationInput}
                    onChange={(e) => setCertificationInput(e.target.value)}
                    placeholder="Add a certification"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCertification())}
                    className="flex-1 p-2 border rounded-md"
                  />
                  <button
                    type="button"
                    onClick={addCertification}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Boat Information */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Boat Information</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="boatType" className="block text-sm font-medium mb-1">Boat Type</label>
                <input
                  type="text"
                  id="boatType"
                  value={formData.boatInformation?.boatType || ""}
                  onChange={(e) => handleBoatInfoChange("boatType", e.target.value)}
                  placeholder="e.g., ILCA 6"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label htmlFor="boatName" className="block text-sm font-medium mb-1">Boat Name</label>
                <input
                  type="text"
                  id="boatName"
                  value={formData.boatInformation?.boatName || ""}
                  onChange={(e) => handleBoatInfoChange("boatName", e.target.value)}
                  placeholder="Your boat's name"
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sailNumber" className="block text-sm font-medium mb-1">Sail Number</label>
                <input
                  type="text"
                  id="sailNumber"
                  value={formData.boatInformation?.sailNumber || ""}
                  onChange={(e) => handleBoatInfoChange("sailNumber", e.target.value)}
                  placeholder="e.g., NOR 218401"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label htmlFor="yearBuilt" className="block text-sm font-medium mb-1">Year Built</label>
                <input
                  type="text"
                  id="yearBuilt"
                  value={formData.boatInformation?.yearBuilt || ""}
                  onChange={(e) => handleBoatInfoChange("yearBuilt", e.target.value)}
                  placeholder="e.g., 2020"
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium mb-1">Manufacturer</label>
              <input
                type="text"
                id="manufacturer"
                value={formData.boatInformation?.manufacturer || ""}
                onChange={(e) => handleBoatInfoChange("manufacturer", e.target.value)}
                placeholder="e.g., PSA"
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Privacy Settings</h2>
          <p className="text-sm text-gray-600 mb-4">
            Control what information is visible to others
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showEmail"
                checked={formData.privacySettings?.showEmail || false}
                onChange={(e) => handlePrivacyChange("showEmail", e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showEmail" className="text-sm font-medium">Show email address</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showLocation"
                checked={formData.privacySettings?.showLocation || false}
                onChange={(e) => handlePrivacyChange("showLocation", e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showLocation" className="text-sm font-medium">Show location</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showExperience"
                checked={formData.privacySettings?.showExperience || false}
                onChange={(e) => handlePrivacyChange("showExperience", e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showExperience" className="text-sm font-medium">Show sailing experience</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showBoatInfo"
                checked={formData.privacySettings?.showBoatInfo || false}
                onChange={(e) => handlePrivacyChange("showBoatInfo", e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showBoatInfo" className="text-sm font-medium">Show boat information</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showActivity"
                checked={formData.privacySettings?.showActivity || false}
                onChange={(e) => handlePrivacyChange("showActivity", e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showActivity" className="text-sm font-medium">Show activity status</label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
