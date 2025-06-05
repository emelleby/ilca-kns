"use server";

import { db } from "@/db";
import { randomBytes } from "crypto";

// Organization Management Functions

export async function createOrganization(name: string, description?: string) {
  try {
    const organization = await db.organization.create({
      data: {
        name,
        description,
      },
    });
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
  try {
    const organization = await db.organization.update({
      where: { id: organizationId },
      data,
    });
    return organization;
  } catch (error) {
    console.error("Error updating organization:", error);
    return null;
  }
}

export async function deleteOrganization(organizationId: string) {
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

export async function getAllOrganizations() {
  try {
    const organizations = await db.organization.findMany({
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
    return organizations;
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }
}

// Helper function to format organizations for display
export async function getOrganizationsForDisplay() {
  try {
    const organizations = await getAllOrganizations();

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
  try {
    // Check if membership already exists
    const existingMembership = await db.organizationMembership.findFirst({
      where: {
        userId,
        organizationId
      }
    });

    if (existingMembership) {
      return null; // Already a member
    }

    const membership = await db.organizationMembership.create({
      data: {
        userId,
        organizationId,
        role,
      },
    });
    return membership;
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
  try {
    const membership = await db.organizationMembership.updateMany({
      where: {
        userId,
        organizationId
      },
      data: {
        role: newRole
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
  role: string,
  createdBy: string
) {
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
        createdBy,
      },
    });

    return invitation;
  } catch (error) {
    console.error("Error creating invitation:", error);
    return null;
  }
}

export async function getInvitationByToken(token: string) {
  try {
    const invitation = await db.organizationInvitation.findUnique({
      where: { token },
      include: {
        organization: true
      }
    });

    // Check if invitation is valid
    if (!invitation ||
        invitation.status !== "PENDING" ||
        invitation.expiresAt < new Date()) {
      return null;
    }

    return invitation;
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return null;
  }
}

export async function acceptInvitation(token: string, userId: string) {
  try {
    const invitation = await getInvitationByToken(token);
    if (!invitation) {
      return false;
    }

    // Add user to organization
    const membership = await addMemberToOrganization(
      invitation.organizationId,
      userId,
      invitation.role
    );

    if (membership) {
      // Mark invitation as accepted
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

export async function rejectInvitation(token: string) {
  try {
    const invitation = await getInvitationByToken(token);
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
