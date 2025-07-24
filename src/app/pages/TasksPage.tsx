"use client";

import { HomeLayout } from "@/app/layouts/HomeLayout";
import { TasksTableClient } from "@/app/components/TasksTableClient";
import tasksData from 'tasks/tasks.json';
import { RequestInfo } from "rwsdk/worker";

interface Task {
  id: number;
  title: string;
  description: string;
  details: string;
  testStrategy: string;
  priority: string;
  dependencies: number[];
  status: string;
  subtasks: any[]; // Define a more specific type if subtasks are structured
}

// Function to get tasks data - provides error handling and fallback
function getTasksData(): Task[] {
  try {
    return tasksData.tasks || [];
  } catch (error) {
    console.error('Failed to load tasks data:', error);
    return [];
  }
}

export function TasksPage(props: RequestInfo) {
  const tasks = getTasksData();

  return (
    <HomeLayout {...props}>
      <div className="w-full px-6 mx-auto py-8">
        <h1 className="page-title">Tasks</h1> 
 
          <TasksTableClient tasks={tasks} />

      </div>
    </HomeLayout>
  );
}
