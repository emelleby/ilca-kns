import { RequestInfo } from "rwsdk/worker"
import { TestingContent } from "./TestingContent"

export async function Test(props: RequestInfo) {
  return (
    <div className="w-full px-6 mx-auto py-8">
      <h1>Testing</h1>
    </div>
  )
}
