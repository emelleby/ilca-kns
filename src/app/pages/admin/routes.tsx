import { route } from "rwsdk/router";
import { isSuperUser } from "@/app/interceptors";
import AdminDashboard from "./AdminDashboard";
import OrganizationManagement from "./OrganizationManagement";
import CreateOrganization from "./CreateOrganization";
import OrganizationDetails from "./OrganizationDetails";

export const routes = [
  route("/", [isSuperUser, AdminDashboard]),
  route("/organizations", [isSuperUser, OrganizationManagement]),
  route("/organizations/create", [isSuperUser, CreateOrganization]),
  route("/organizations/:organizationId", [isSuperUser, OrganizationDetails]),
];
