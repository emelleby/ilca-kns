import { use } from "react"
import { requestInfo } from "rwsdk/worker"

import { Suspense } from "react"
import { TestingContent } from "./TestingContent"
import { Proportions } from "lucide-react"

async function fetchExampleRemoteRequest() {
  await new Promise((resolve) => setTimeout(resolve, 3000))
  const { ctx } = requestInfo
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-700 my-4">Remote Content</h2>
      <p>Hello from the remote request!</p>
      <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(ctx.user, null, 2)}</pre>
    </div>
  )
}

function DisplayRequest({ requestPromise }: { requestPromise: Promise<any> }) {
  const content = use(requestPromise)

  return <div>{/* <div>{content}</div> */}P</div>
}

export function Test3() {
  // const requestPromise = TestingContent(ctx)
  const requestPromise = fetchExampleRemoteRequest()

  return (
    <div>
      <h1 className="text-4xl font-bold text-green-800 mb-8">Non-blocking Suspense</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <DisplayRequest requestPromise={requestPromise} />
        {/* <TestingContent ctx={ctx}/> */}
      </Suspense>
    </div>
  )
}
