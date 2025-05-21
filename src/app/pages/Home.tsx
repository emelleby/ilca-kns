import { HomeLayout } from "../layouts/HomeLayout";
import { RequestInfo } from "rwsdk/worker";
import { ReactNode } from "react";

export function Home(props: RequestInfo & { children?: ReactNode }) {
  return (
    <HomeLayout {...props}>
      <div>
        <h1>Home</h1>
      </div>
    </HomeLayout>
  );
}
