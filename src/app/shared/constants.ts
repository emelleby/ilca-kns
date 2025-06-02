export const CONSTANTS = Object.freeze({
  FROM_EMAIL: "ILCA KNS <onboarding@resend.dev>", // TODO: Replace with your verified domain
});

// roles.ts
export const ROLES = {
  ADMIN: "ADMIN",
  COACH: "COACH",
  MEMBER: "MEMBER"
};

// roleHierarchy.ts
export const roleHierarchy = {
  ADMIN: ["ADMIN", "COACH", "MEMBER"],
  COACH: ["COACH", "MEMBER"],
  MEMBER: ["MEMBER"]
};