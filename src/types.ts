export type Priority = 1 | 2 | 3 | 4;
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  subtasks?: Subtask[];
  status: TaskStatus;
  priority: Priority;
  dueDate?: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
  tags?: string[];
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  start: any; // Firestore Timestamp
  end: any; // Firestore Timestamp
  timezone: string;
  location?: string;
  attendees?: string[];
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  body: string;
  tags?: string[];
  createdAt: any; // Firestore Timestamp
}

export interface AINews {
  id: string;
  userId: string;
  date: any; // Firestore Timestamp
  source: string;
  headline: string;
  summary: string;
  dashboard_note_id: string;
  subtasks?: Subtask[];
}

export interface AgentLog {
  id: string;
  userId: string;
  agent: string;
  action: string;
  status: string;
  durationMs: number;
  timestamp: any; // Firestore Timestamp
}

export interface WorkflowStep {
  step_id: number;
  agent: string;
  action: string;
  params: any;
  status: 'pending' | 'running' | 'done' | 'failed';
  output?: any;
  retry_count: number;
}

export interface WorkflowSession {
  id: string;
  userId: string;
  name: string;
  steps: WorkflowStep[];
  currentStep: number;
  status: 'planning' | 'awaiting_confirmation' | 'executing' | 'partial' | 'complete' | 'failed';
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  intent?: string;
  agents_invoked?: string[];
  workflow_id?: string;
}
