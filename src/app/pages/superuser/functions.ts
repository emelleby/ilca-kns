"use server";

import { db } from "@/db";
import { randomBytes } from "crypto";
import { z } from "zod";
import { requireSelfOrSuperUser, requireSuperUser, requireUser } from "@/app/auth/guards";
import {
  ORGANIZATION_ROLES,
  addMembership,
  findValidInvitation,
} from "@/app/lib/organizations";

// Every export here is a browser-callable endpoint. Each one starts with a guard.
// Policies: docs/security/server-function-authorization.md §4.1

const idSchema = z.string().min(1).max(100);
const roleSchema = z.enum(ORGANIZATION_ROLES);
const organizationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional(),
});

// Organization Management Functions

export async function createOrganization(name: string, description?: string) {
  requireSuperUser();
  const data = organizationSchema.parse({ name, description });
  try {
    const organization = await db.organization.create({ data });
    return organization;
  } catch (error) {
    console.error("Error creating organization:", error);
    return null;
  }
}

export async function updateOrganization(
  organizationId: string,
  data: { name?: string; description?: string }
) {
  requireSuperUser();
  idSchema.parse(organizationId);
  const update = organizationSchema.partial().parse(data);
  try {
    const organization = await db.organization.update({
      where: { id: organizationId },
      data: update,
    });
    return organization;
  } catch (error) {
    console.error("Error updating organization:", error);
    return null;
  }
}

export async function deleteOrganization(organizationId: string) {
  requireSuperUser();
  idSchema.parse(organizationId);
  try {
    // First, get the organization to check if it exists and get member count
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            members: true,
            invitations: true
          }
        }
      }
    });

    if (!organization) {
      return { success: false, error: "Organization not found" };
    }

    // Explicitly delete all memberships first (withdrawing users from organization)
    // This ensures users remain in the system but lose their organization membership
    await db.organizationMembership.deleteMany({
      where: { organizationId }
    });

    // Delete all pending invitations
    await db.organizationInvitation.deleteMany({
      where: { organizationId }
    });

    // Finally, delete the organization itself
    await db.organization.delete({
      where: { id: organizationId },
    });

    return {
      success: true,
      memberCount: organization._count.members,
      invitationCount: organization._count.invitations
    };
  } catch (error) {
    console.error("Error deleting organization:", error);
    return { success: false, error: "Failed to delete organization" };
  }
}

export async function getOrganization(organizationId: string) {
  requireSuperUser();
  try {
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              }
            }
          }
        },
        invitations: {
          where: {
            status: "PENDING",
            expiresAt: { gt: new Date() }
          }
        }
      },
    });
    return organization;
  } catch (error) {
    console.error("Error fetching organization:", error);
    return null;
  }
}

function loadAllOrganizations() {
  return db.organization.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            invitations: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
}

export async function getAllOrganizations() {
  requireSuperUser();
  try {
    return await loadAllOrganizations();
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }
}

// Helper function to format organizations for display
export async function getOrganizationsForDisplay() {
  requireSuperUser();
  try {
    const organizations = await loadAllOrganizations();

    // Transform the data for the dashboard display
    return organizations.map(org => {
      // Find the admin/owner (first admin member)
      const adminMember = org.members.find(member => member.role === "ADMIN");

      return {
        id: org.id,
        name: org.name,
        description: org.description,
        memberCount: org._count.members,
        owner: adminMember?.user.username || "No admin assigned",
        createdAt: org.createdAt,
        updatedAt: org.updatedAt
      };
    });
  } catch (error) {
    console.error("Error formatting organizations for display:", error);
    return [];
  }
}

// Membership Management Functions (SUPERUSER level)

export async function addMemberToOrganization(
  organizationId: string,
  userId: string,
  role: string = "MEMBER"
) {
  requireSuperUser();
  idSchema.parse(organizationId);
  idSchema.parse(userId);
  const validRole = roleSchema.parse(role);
  try {
    return await addMembership(organizationId, userId, validRole);
  } catch (error) {
    console.error("Error adding member to organization:", error);
    return null;
  }
}

export async function updateMemberRole(
  organizationId: string,
  userId: string,
  newRole: string
) {
  requireSuperUser();
  idSchema.parse(organizationId);
  idSchema.parse(userId);
  const role = roleSchema.parse(newRole);
  try {
    const membership = await db.organizationMembership.updateMany({
      where: {
        userId,
        organizationId
      },
      data: {
        role
      }
    });
    return membership.count > 0;
  } catch (error) {
    console.error("Error updating member role:", error);
    return false;
  }
}

export async function removeMemberFromOrganization(
  organizationId: string,
  userId: string
) {
  requireSuperUser();
  idSchema.parse(organizationId);
  idSchema.parse(userId);
  try {
    await db.organizationMembership.deleteMany({
      where: {
        userId,
        organizationId
      }
    });
    return true;
  } catch (error) {
    console.error("Error removing member from organization:", error);
    return false;
  }
}

// Invitation Management Functions (SUPERUSER level)

export async function createInvitation(
  organizationId: string,
  email: string,
  role: string
) {
  const creator = requireSuperUser();
  idSchema.parse(organizationId);
  email = z.string().trim().email().parse(email);
  role = roleSchema.parse(role);
  try {
    // Check if user already exists and is a member
    const existingUser = await db.user.findUnique({
      where: { email },
      include: {
        organizations: {
          where: { organizationId }
        }
      }
    });

    if (existingUser && existingUser.organizations.length > 0) {
      return null; // User is already a member
    }

    // Check for existing pending invitation
    const existingInvitation = await db.organizationInvitation.findFirst({
      where: {
        email,
        organizationId,
        status: "PENDING",
        expiresAt: { gt: new Date() }
      }
    });

    if (existingInvitation) {
      return null; // Invitation already exists
    }

    // Create new invitation
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const invitation = await db.organizationInvitation.create({
      data: {
        email,
        organizationId,
        role,
        token,
        expiresAt,
        createdBy: creator.id,
      },
    });

    return invitation;
  } catch (error) {
    console.error("Error creating invitation:", error);
    return null;
  }
}

// PUBLIC (TOKEN): knowing the secret token is the authorization.
// Returns only what an invitation page needs.
export async function getInvitationByToken(token: string) {
  try {
    const invitation = await findValidInvitation(z.string().min(1).max(200).parse(token));
    if (!invitation) return null;
    return {
      organizationName: invitation.organization.name,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return null;
  }
}

// SESSION: the signed-in user accepts an invitation addressed to their own email.
export async function acceptInvitation(token: string) {
  const user = requireUser();
  try {
    const invitation = await findValidInvitation(z.string().min(1).max(200).parse(token));
    if (!invitation) return false;
    if (!user.email || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return false;
    }

    const membership = await addMembership(
      invitation.organizationId,
      user.id,
      roleSchema.parse(invitation.role)
    );

    if (membership) {
      await db.organizationInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date()
        }
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return false;
  }
}

// PUBLIC (TOKEN): knowing the secret token is the authorization.
export async function rejectInvitation(token: string) {
  try {
    const invitation = await findValidInvitation(z.string().min(1).max(200).parse(token));
    if (!invitation) {
      return false;
    }

    await db.organizationInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "REJECTED"
      }
    });

    return true;
  } catch (error) {
    console.error("Error rejecting invitation:", error);
    return false;
  }
}

// User's Organizations Functions

export async function getUserOrganizations(userId: string) {
  requireSelfOrSuperUser(userId);
  try {
    const memberships = await db.organizationMembership.findMany({
      where: { userId },
      include: {
        organization: true
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });

    return memberships.map(membership => ({
      ...membership.organization,
      role: membership.role,
      joinedAt: membership.joinedAt
    }));
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    return [];
  }
}
