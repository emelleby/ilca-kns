import { HomeLayout } from "@/app/layouts/HomeLayout";
import { RequestInfo } from "rwsdk/worker";
import { ReactNode } from "react";
import { PostList } from "@/app/components/PostList";

export function FrontPage(props: RequestInfo & { children?: ReactNode }) {
  return (
    <HomeLayout {...props}>
      {/* Latest Posts listing for not-logged-in viewers */}
      <PostList />
    </HomeLayout>
  );
}
