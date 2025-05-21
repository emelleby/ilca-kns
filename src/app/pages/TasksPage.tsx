"use client"

import React, { useState, useEffect, ReactNode } from 'react';
import { HomeLayout } from "@/app/layouts/HomeLayout";
import { RequestInfo } from "rwsdk/worker";


// Assuming tasks.json is directly importable from the root or a specified path
import tasksData from 'tasks/tasks.json';

import {
  Table,
  TableBody,
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
  DialogTrigger,
} from '@/app/components/ui/dialog'; // Adjust import path if necessary

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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Dependencies</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.id}</TableCell>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>{task.status}</TableCell>
                    <TableCell>{task.priority}</TableCell>
                    <TableCell>{task.dependencies.join(', ') || 'None'}</TableCell>
                    <TableCell className="text-right">                    
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout {...props}>
      

      <div className="container mx-auto py-10">
        <h1 className="page-title">Tasks</h1>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Dependencies</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.id}</TableCell>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{task.status}</TableCell>
                  <TableCell>{task.priority}</TableCell>
                  <TableCell>{task.dependencies.join(', ') || 'None'}</TableCell>
                  <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(task)}>
                        View Details
                      </Button>
                    </DialogTrigger>
                    
                  </Dialog>
                    
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
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
                  <p>{selectedTask.dependencies.join(', ') || 'None'}</p>
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
