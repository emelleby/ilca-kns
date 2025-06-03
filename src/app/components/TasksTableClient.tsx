"use client"

import { useState } from 'react';
import { ClientErrorBoundary } from './ClientErrorBoundary';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';

import { Button } from '@/app/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

import { Badge } from '@/app/components/ui/badge';

interface Task {
  id: number;
  title: string;
  description: string;
  details: string;
  testStrategy: string;
  priority: string;
  dependencies: number[];
  status: string;
  subtasks: any[];
}

interface TasksTableClientProps {
  tasks: Task[];
}

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

export function TasksTableClient({ tasks }: TasksTableClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setIsOpen(true);
  };

  return (
    <ClientErrorBoundary>
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
                     {selectedTask.subtasks.map((subtask: any) => (
                       <li key={subtask.id}>{subtask.id}: {subtask.title} ({subtask.status})</li>
                     ))}
                   </ul>
                 </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ClientErrorBoundary>
  );
}
