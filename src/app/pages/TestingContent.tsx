// "use server"
import { RequestInfo } from "rwsdk/worker"
import { db } from "src/db"

export async function TestingContent(props: RequestInfo) {
  // const user = await db.user.findUnique({ where: { id: ctx.user?.id } })
  const { ctx } = props
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(ctx.user, null, 2)}</pre>
      </div>
    </div>
  )
}
