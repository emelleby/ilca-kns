import { Suspense } from "react"
import { TestingContent } from "./TestingContent"
import { RequestInfo } from "rwsdk/worker"
import { use } from "react"

function DisplayRequest({ requestPromise }: { requestPromise: Promise<string> }) {
  const content = use(requestPromise)
}
function SimpleContent() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Simple Static Content!</h2>
      <p className="text-gray-600">This is static content rendered synchronously.</p>
    </div>
  )
}

// export async function Test2Data({ ctx }: RequestInfo) {
//   // const user = await db.user.findUnique({ where: { id: ctx.user?.id } })
//   return (
//     <div className="p-4 bg-blue-50 rounded">
//       <h2 className="text-xl font-bold mb-4">User Data from Database</h2>
//       <Suspense fallback={<div>Loading...</div>}></Suspense>
//       {/* <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(ctx.user, null, 2)}</pre> */}
//     </div>
//   )
// }

export async function Test2(props: RequestInfo) {
  const requestPromise = TestingContent(props.ctx)
  return (
    <div className="w-full px-6 mx-auto py-8">
      <h1 className="text-2xl font-bold">Test2 Page</h1>
      <SimpleContent />

      <Suspense fallback={<div>Loading...</div>}>
        <DisplayRequest requestPromise={requestPromise} />
      </Suspense>
    </div>
  )
}
