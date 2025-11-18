import { SidebarLayout } from "@/app/layouts/SidebarLayout"
import { RequestInfo } from "rwsdk/worker"
import { db } from "src/db"

async function Testing({ ctx }: RequestInfo) {
  const user = await db.user.findUnique({ where: { id: ctx.user?.id } })
  console.log(user)
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(user, null, 2)}</pre>
      </div>
    </div>
  )
}

export async function Test(props: RequestInfo) {
  const content = await Testing(props)

  return (
    <SidebarLayout {...props}>
      <div className="w-full px-6 mx-auto py-8">
        <h1>Testing</h1>
        {content}
      </div>
    </SidebarLayout>
  )
}
