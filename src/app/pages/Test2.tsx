import { SidebarLayout } from "@/app/layouts/SidebarLayout"
import { RequestInfo } from "rwsdk/worker"
import { db } from "src/db"

function SimpleContent() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Simple Static Content</h2>
      <p className="text-gray-600">This is static content rendered synchronously.</p>
    </div>
  )
}

export async function Test2Data({ ctx }) {
  const user = await db.user.findUnique({ where: { id: ctx.user?.id } })
  return (
    <div className="p-4 bg-blue-50 rounded">
      <h2 className="text-xl font-bold mb-4">User Data from Database</h2>
      <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(user, null, 2)}</pre>
    </div>
  )
}

export async function Test2({ ctx }) {
  return (
    <SidebarLayout>
      <div className="w-full px-6 mx-auto py-8">
        <h1 className="text-2xl font-bold">Test2 Page</h1>
        <SimpleContent />
        <Test2Data ctx={ctx} />
      </div>
    </SidebarLayout>
  )
}
