import { HomeLayout } from "@/app/layouts/HomeLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/app/components/ui/table";
import { Eye, Edit, Trash2 } from "lucide-react";
import { RequestInfo } from "rwsdk/worker";
import CreateOrganizationDialog from "./CreateOrganizationDialog";
import { getOrganizationsForDisplay } from "./functions";

export default async function Dashboard(props: RequestInfo) {
  const { ctx } = props;

  // Fetch organizations data from server
  const organizations = await getOrganizationsForDisplay();

  return (
    <HomeLayout {...props}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SUPERUSER Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome, {ctx.user?.username}. You have SUPERUSER access.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Organization Management</CardTitle>
              <CardDescription>
                Create and manage organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Coming soon: Organization CRUD functionality
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Coming soon: User management features
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>
                View system statistics and health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Coming soon: System monitoring
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Test</CardTitle>
              <CardDescription>
                Verify SUPERUSER authentication is working
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>User ID:</strong> {ctx.user?.id}</p>
                <p><strong>Username:</strong> {ctx.user?.username}</p>
                <p><strong>Role:</strong> {ctx.user?.role}</p>
                <p><strong>Email:</strong> {ctx.user?.email || "Not set"}</p>
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 text-sm">
                    ✅ SUPERUSER authentication is working correctly!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Management Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
              <p className="text-gray-600 mt-1">
                Manage sailing organizations and their members
              </p>
            </div>
            <CreateOrganizationDialog />
          </div>

          {/* Organizations Table */}
          <Card>
            <CardContent className="p-0">
              {/* Mock data - will be replaced with real data later */}
              {organizations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto max-w-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No organizations yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Get started by creating your first sailing organization.
                    </p>
                    <CreateOrganizationDialog
                      trigger={
                        <Button>
                          Create Your First Organization
                        </Button>
                      }
                    />
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization Name</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org: any) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell>{org.memberCount}</TableCell>
                        <TableCell>{org.owner}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View organization</span>
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit organization</span>
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete organization</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </HomeLayout>
  );
}
