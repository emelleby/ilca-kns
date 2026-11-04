'use client'

import { HomeLayout } from '@/app/layouts/HomeLayout'
import { TasksTableClient } from '@/app/components/TasksTableClient'
import tasksData from 'tasks/tasks.json'
import { RequestInfo } from 'rwsdk/worker'

interface Task {
  id: number
  title: string
  description: string
  details: string
  testStrategy: string
  priority: string
  dependencies: number[]
  status: string
  subtasks: any[] // Define a more specific type if subtasks are structured
}

// tasks.json is imported as a parsed JSON object (not raw text), so no JSON.parse
function getTasksData(): Task[] {
  return ((tasksData as { tasks?: Task[] }).tasks ?? []) as Task[]
}

export function TasksPage(props: RequestInfo) {
  const tasks = getTasksData()

  return (
    <HomeLayout {...props}>
      <div className="w-full px-6 mx-auto py-8">
        <h1 className="page-title">Tasks</h1>

        <TasksTableClient tasks={tasks} />
      </div>
    </HomeLayout>
  )
}
