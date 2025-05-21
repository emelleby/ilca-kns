"use client"

import React, { useState, useEffect, ReactNode } from 'react';
import { HomeLayout } from "@/app/layouts/HomeLayout";
import { RequestInfo } from "rwsdk/worker";


// Assuming tasks.json is directly importable from the root or a specified path
import tasksData from 'tasks/tasks.json';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'; // Adjust import path if necessary

import { Button } from '@/app/components/ui/button'; // Adjust import path if necessary

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'; // Adjust import path if necessary

import { Badge } from '@/app/components/ui/badge'; // Adjust import path if necessary

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

const tasks: Task[] = tasksData.tasks;

// Helper function to get priority badge styling
const getPriorityBadgeStyle = (priority: string): string => {
  switch (priority) {
    case 'high':
      return "bg-red-200 text-red-900 border-red-300";
    case 'medium':
      return "bg-amber-100 text-amber-800 border-amber-200";
    case 'low':
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// Helper function to get status badge styling
const getStatusBadgeStyle = (status: string): string => {
  switch (status) {
    case 'pending':
      return "bg-blue-100 text-blue-800 border-blue-200";
    case 'in-progress':
      return "bg-purple-100 text-purple-800 border-purple-200";
    case 'done':
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-blue-100 text-blue-800 border-blue-200";
  }
};

// Helper function to format dependencies
const formatDependencies = (dependencies: number[]): string => {
  return dependencies.join(', ') || 'None';
};

// Helper function to get dependencies badge styling
const getDependenciesBadgeStyle = (): string => {
  return "bg-gray-100 text-gray-800 border-gray-200";
};

export function TasksPage(props: RequestInfo & { children?: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setIsOpen(true);
  };

  if (!isClient) {
    return (
      <HomeLayout {...props}>
        <div className="container mx-auto py-10">
          <h1 className="page-title">Tasks</h1>
          <div className="rounded-md border overflow-hidden">
            <div className="p-4">
              {/* Skeleton loader */}
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-1/4"></div>
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout {...props}>


      <div className="container mx-auto py-10">
        <h1 className="page-title">Tasks</h1>
        <div className="rounded-md border overflow-hidden">
          <Table className="w-full md:w-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead className="w-[150px]">Title</TableHead>
                <TableHead className="max-w-[300px] w-full">Description</TableHead>
                <TableHead className="w-[100px]">Priority</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[120px]">Dependencies</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.id}</TableCell>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="truncate">{task.description}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getPriorityBadgeStyle(task.priority)}
                    >
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusBadgeStyle(task.status)}
                    >
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getDependenciesBadgeStyle()}>
                      {formatDependencies(task.dependencies)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(task)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>List of development tasks</TableCaption>
          </Table>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{selectedTask?.title}</DialogTitle>
              <DialogDescription>
                Details for Task ID: {selectedTask?.id}
              </DialogDescription>
            </DialogHeader>
            {selectedTask && (
              <div className="grid gap-4 py-4">
                <div>
                  <h3 className="font-semibold">Description:</h3>
                  <p>{selectedTask.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Details:</h3>
                  <pre className="whitespace-pre-wrap text-sm">{selectedTask.details}</pre>
                </div>
                <div>
                  <h3 className="font-semibold">Test Strategy:</h3>
                  <p>{selectedTask.testStrategy}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Status:</h3>
                  <p>{selectedTask.status}</p>
                </div>
                 <div>
                  <h3 className="font-semibold">Priority:</h3>
                  <p>{selectedTask.priority}</p>
                </div>
                 <div>
                  <h3 className="font-semibold">Dependencies:</h3>
                  <p>{formatDependencies(selectedTask.dependencies)}</p>
                </div>
                {selectedTask.subtasks.length > 0 && (
                   <div>
                    <h3 className="font-semibold">Subtasks:</h3>
                     <ul className="list-disc list-inside">
                       {selectedTask.subtasks.map(subtask => (
                         <li key={subtask.id}>{subtask.id}: {subtask.title} ({subtask.status})</li>
                       ))}
                     </ul>
                   </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </HomeLayout>
  );
}
