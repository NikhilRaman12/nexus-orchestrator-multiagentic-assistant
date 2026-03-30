import React, { useState, useEffect } from 'react';
import { db, auth, collection, query, where, onSnapshot, Timestamp, updateDoc, doc, orderBy, limit } from '../firebase';
import { Task, CalendarEvent, Note, Subtask, AgentLog, AINews } from '../types';
import { CheckCircle2, Calendar, FileText, Clock, AlertCircle, ChevronRight, Plus, X, Trash2, Check, Activity, Newspaper, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [news, setNews] = useState<AINews[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const qTasks = query(collection(db, 'tasks'), where('userId', '==', userId));
    const qEvents = query(collection(db, 'events'), where('userId', '==', userId));
    const qNotes = query(collection(db, 'notes'), where('userId', '==', userId));
    const qLogs = query(collection(db, 'agent_logs'), where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(5));
    const qNews = query(collection(db, 'ai_news'), where('userId', '==', userId), orderBy('date', 'desc'), limit(5));

    const unsubTasks = onSnapshot(qTasks, (snap) => {
      const fetchedTasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(fetchedTasks);
      
      // Update selected task if it's currently open
      if (selectedTask) {
        const updated = fetchedTasks.find(t => t.id === selectedTask.id);
        if (updated) setSelectedTask(updated);
      }
    });

    const unsubEvents = onSnapshot(qEvents, (snap) => {
      setEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent)));
    });

    const unsubNotes = onSnapshot(qNotes, (snap) => {
      setNotes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));
    });

    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgentLog)));
    });

    const unsubNews = onSnapshot(qNews, (snap) => {
      setNews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AINews)));
      setLoading(false);
    });

    return () => {
      unsubTasks();
      unsubEvents();
      unsubNotes();
      unsubLogs();
      unsubNews();
    };
  }, [selectedTask?.id]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleUpdateTask = async (updates: Partial<Task>) => {
    if (!selectedTask) return;
    try {
      await updateDoc(doc(db, 'tasks', selectedTask.id), updates);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleAddSubtask = () => {
    if (!selectedTask) return;
    const newSubtask: Subtask = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      completed: false
    };
    const subtasks = [...(selectedTask.subtasks || []), newSubtask];
    handleUpdateTask({ subtasks });
  };

  const handleToggleSubtask = (subtaskId: string) => {
    if (!selectedTask || !selectedTask.subtasks) return;
    const subtasks = selectedTask.subtasks.map(s => 
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    handleUpdateTask({ subtasks });
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    if (!selectedTask || !selectedTask.subtasks) return;
    const subtasks = selectedTask.subtasks.filter(s => s.id !== subtaskId);
    handleUpdateTask({ subtasks });
  };

  const handleSubtaskTitleChange = (subtaskId: string, title: string) => {
    if (!selectedTask || !selectedTask.subtasks) return;
    const subtasks = selectedTask.subtasks.map(s => 
      s.id === subtaskId ? { ...s, title } : s
    );
    handleUpdateTask({ subtasks });
  };

  const highPriorityTasks = tasks.filter(t => t.priority === 1 && t.status !== 'done');
  const upcomingEvents = events.sort((a, b) => a.start.toMillis() - b.start.toMillis()).slice(0, 3);

  return (
    <div className="space-y-8 p-6 overflow-y-auto h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Briefing</h1>
          <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, MMMM do')}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider">System Online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />}
          label="Active Tasks"
          value={tasks.filter(t => t.status !== 'done').length}
          color="blue"
        />
        <StatCard 
          icon={<Calendar className="w-5 h-5 text-purple-600" />}
          label="Events Today"
          value={events.length}
          color="purple"
        />
        <StatCard 
          icon={<FileText className="w-5 h-5 text-orange-600" />}
          label="Total Notes"
          value={notes.length}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* High Priority Tasks */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              High Priority
            </h3>
            <span className="text-[10px] font-bold text-gray-400">{highPriorityTasks.length} ITEMS</span>
          </div>
          <div className="space-y-3">
            {highPriorityTasks.length > 0 ? (
              highPriorityTasks.map(task => (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => handleTaskClick(task)}
                  className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                        {task.dueDate ? `Due ${format(task.dueDate.toDate(), 'MMM d, h:mm a')}` : 'No due date'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
                </motion.div>
              ))
            ) : (
              <div className="p-8 border-2 border-dashed border-gray-100 rounded-2xl text-center">
                <p className="text-xs text-gray-400 font-medium italic">No high priority tasks pending.</p>
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              Upcoming
            </h3>
            <span className="text-[10px] font-bold text-gray-400">{events.length} EVENTS</span>
          </div>
          <div className="space-y-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(event => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex flex-col items-center justify-center text-purple-600">
                      <span className="text-[10px] font-bold leading-none">{format(event.start.toDate(), 'MMM')}</span>
                      <span className="text-sm font-bold leading-none">{format(event.start.toDate(), 'd')}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                        {format(event.start.toDate(), 'h:mm a')} — {format(event.end.toDate(), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
                </motion.div>
              ))
            ) : (
              <div className="p-8 border-2 border-dashed border-gray-100 rounded-2xl text-center">
                <p className="text-xs text-gray-400 font-medium italic">No upcoming events scheduled.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Recent Activity */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Agent Activity
          </h3>
          <span className="text-[10px] font-bold text-gray-400">LATEST LOGS</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-white border border-gray-100 rounded-2xl flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter",
                  log.agent === 'TaskAgent' ? "bg-red-50 text-red-600" :
                  log.agent === 'NotesAgent' ? "bg-orange-50 text-orange-600" :
                  log.agent === 'CalendarAgent' ? "bg-purple-50 text-purple-600" :
                  "bg-blue-50 text-blue-600"
                )}>
                  {log.agent}
                </span>
                <span className="text-[9px] font-bold text-gray-400">
                  {log.timestamp ? format(log.timestamp.toDate(), 'h:mm:ss a') : '...'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  log.status === 'success' ? "bg-green-500" : "bg-red-500"
                )} />
                <p className="text-xs font-bold text-gray-900 uppercase tracking-tight truncate">
                  {log.action.replace('_', ' ')}
                </p>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">
                Execution time: {log.durationMs}ms
              </p>
            </motion.div>
          ))}
          {logs.length === 0 && (
            <div className="col-span-full p-8 border-2 border-dashed border-gray-100 rounded-3xl text-center">
              <p className="text-xs text-gray-400 italic">No recent agent activity recorded.</p>
            </div>
          )}
        </div>
      </section>

      {/* AI News Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-orange-500" />
            AI News Feed
          </h3>
          <span className="text-[10px] font-bold text-gray-400">LATEST UPDATES</span>
        </div>
        <div className="space-y-4">
          {news.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-white border border-gray-100 rounded-3xl hover:border-gray-200 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 leading-tight mb-1">{item.headline}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-full">
                      {item.source}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {item.date ? format(item.date.toDate(), 'MMM d, yyyy') : '...'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                  <LinkIcon className="w-3 h-3 text-gray-400" />
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                    Note ID: {item.dashboard_note_id.slice(-6)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{item.summary}</p>
              
              {item.subtasks && item.subtasks.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Key Points / Subtasks</span>
                  <div className="grid grid-cols-1 gap-2">
                    {item.subtasks.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-3 p-2 bg-gray-50/50 rounded-xl border border-gray-100/50">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${sub.completed ? 'bg-orange-500 border-orange-500' : 'border-gray-200'}`}>
                          {sub.completed && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={`text-xs font-medium ${sub.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                          {sub.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          {news.length === 0 && (
            <div className="p-12 border-2 border-dashed border-gray-100 rounded-3xl text-center">
              <p className="text-xs text-gray-400 italic">No news entries found. Ask Nexus to summarize today's AI news.</p>
            </div>
          )}
        </div>
      </section>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    selectedTask.priority === 1 ? "bg-red-500" : "bg-blue-500"
                  )} />
                  <h2 className="text-lg font-bold text-gray-900 truncate max-w-[400px]">{selectedTask.title}</h2>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-xl text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Description Section */}
                <section className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Description</label>
                  <textarea
                    value={selectedTask.description || ''}
                    onChange={(e) => handleUpdateTask({ description: e.target.value })}
                    placeholder="Add a detailed description for this task..."
                    className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 transition-all resize-none"
                  />
                </section>

                {/* Subtasks Section */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Subtasks</label>
                    <button 
                      onClick={handleAddSubtask}
                      className="flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-gray-800 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Add Subtask
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedTask.subtasks && selectedTask.subtasks.length > 0 ? (
                      selectedTask.subtasks.map((subtask) => (
                        <div key={subtask.id} className="group flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all">
                          <button 
                            onClick={() => handleToggleSubtask(subtask.id)}
                            className={cn(
                              "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                              subtask.completed ? "bg-green-500 border-green-500 text-white" : "border-gray-200 hover:border-gray-400"
                            )}
                          >
                            {subtask.completed && <Check className="w-3 h-3" />}
                          </button>
                          <input
                            type="text"
                            value={subtask.title}
                            onChange={(e) => handleSubtaskTitleChange(subtask.id, e.target.value)}
                            placeholder="Subtask title..."
                            className={cn(
                              "flex-1 bg-transparent text-sm focus:outline-none",
                              subtask.completed ? "text-gray-400 line-through" : "text-gray-700"
                            )}
                          />
                          <button 
                            onClick={() => handleRemoveSubtask(subtask.id)}
                            className="p-1.5 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 border border-dashed border-gray-100 rounded-2xl text-center">
                        <p className="text-xs text-gray-400 italic">No subtasks added yet.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                    <span className="text-xs font-bold text-gray-900 uppercase">{selectedTask.status.replace('_', ' ')}</span>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Created</span>
                    <span className="text-xs font-bold text-gray-900">{format(selectedTask.createdAt.toDate(), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100",
    purple: "bg-purple-50 border-purple-100",
    orange: "bg-orange-50 border-orange-100"
  };

  return (
    <div className={cn("p-6 rounded-3xl border transition-all hover:shadow-md", colors[color])}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white rounded-xl shadow-sm">
          {icon}
        </div>
        <span className="text-2xl font-black text-gray-900">{value}</span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
