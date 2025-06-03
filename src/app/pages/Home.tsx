import { HomeLayout } from "@/app/layouts/HomeLayout";
import { RequestInfo } from "rwsdk/worker";
import { ReactNode } from "react";
import { PostList } from "@/app/components/PostList";
import { UserProfileSidebar } from "@/app/components/UserProfileSidebar";
import { AddContentButton } from "@/app/components/AddContentButton";
import { PostFilter } from "@/app/components/PostFilter";

export function Home(props: RequestInfo & { children?: ReactNode }) {
  return (
    <HomeLayout {...props}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - User Profile */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <UserProfileSidebar user={props.ctx?.user} />
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* Content Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-gray-900">Community Feed</h1>
                  <PostFilter />
                </div>
                <AddContentButton />
              </div>

              {/* Posts Feed */}
              <PostList />
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
