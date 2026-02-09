import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    Plus,
    MessageSquare,
    User as UserIcon,
    Loader2,
    Search,
    ArrowLeft,
    UserPlus,
    X,
    Send
} from 'lucide-react';
import '../styles/Board.css';

/**
 * Board Component
 * 
 * Provides a Kanban-style interface for managing tasks within a specific team.
 * Includes features for:
 * - List/Filter tasks
 * - Task Creation & Modification
 * - Task Status Management (Drag & Drop replacement)
 * - Team Activity Logging
 * - Member Management (Add/Remove)
 */
const Board = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [commentText, setCommentText] = useState('');

    // New Task State
    const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '' });
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [addingMember, setAddingMember] = useState(false);

    const [showActivity, setShowActivity] = useState(false);
    const [activityLogs, setActivityLogs] = useState([]);
    const [fetchingLogs, setFetchingLogs] = useState(false);

    useEffect(() => {
        if (user) {
            fetchTeamAndTasks();
        }
    }, [teamId, search, user]);

    const fetchTeamAndTasks = async () => {
        try {
            const teamRes = await api.get(`/teams/${teamId}/members`);
            setMembers(teamRes.data.members || []);

            const params = { search };
            const tasksRes = await api.get(`/teams/${teamId}/tasks`, { params });
            setTasks(tasksRes.data.tasks || []);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivityLogs = async () => {
        setFetchingLogs(true);
        setShowActivity(true);
        try {
            const res = await api.get('/activity');
            setActivityLogs(res.data.logs || []);
        } catch (err) {
            console.error('Failed to fetch logs', err);
        } finally {
            setFetchingLogs(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;
        try {
            await api.post(`/teams/${teamId}/remove-member`, { userId: memberId });
            fetchTeamAndTasks();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to remove member');
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/teams/${teamId}/tasks`, newTask);
            setNewTask({ title: '', description: '', assignedTo: '' });
            setShowTaskForm(false);
            fetchTeamAndTasks();
        } catch (err) {
            alert('Failed to create task');
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!newMemberEmail.trim() || !newMemberName.trim()) return;
        setAddingMember(true);
        try {
            const res = await api.post(`/teams/${teamId}/invite`, {
                name: newMemberName,
                email: newMemberEmail
            });
            setNewMemberEmail('');
            setNewMemberName('');
            setShowMemberForm(false);
            fetchTeamAndTasks();
            alert(res.data.message || 'Member invited successfully');
        } catch (err) {
            console.error('Invite Error:', err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
            alert(`Failed to add member: ${errorMsg}`);
        } finally {
            setAddingMember(false);
        }
    };

    const handleMoveTask = async (taskId, newStatus) => {
        try {
            await api.patch(`/tasks/${taskId}/move`, { status: newStatus });
            setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
            if (selectedTask?._id === taskId) {
                setSelectedTask({ ...selectedTask, status: newStatus });
            }
        } catch (err) {
            alert('Failed to move task');
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        try {
            const res = await api.post(`/tasks/${selectedTask._id}/comment`, { text: commentText });
            setSelectedTask({ ...selectedTask, comments: res.data.comments });
            setCommentText('');
            // Refresh tasks to update comment count on card
            fetchTeamAndTasks();
        } catch (err) {
            alert('Failed to add comment');
        }
    };

    const columns = [
        { id: 'TODO', title: 'To Do', color: '#64748b' },
        { id: 'DOING', title: 'In Progress', color: '#2563eb' },
        { id: 'DONE', title: 'Completed', color: '#22c55e' }
    ];

    if (loading) return <div className="loading-container"><Loader2 className="spinner" /></div>;

    return (
        <div className="board-container fade-in">
            <header className="board-header">
                <div className="container">
                    <div className="board-nav">
                        <button onClick={() => navigate('/')} className="back-btn">
                            <ArrowLeft size={18} />
                            <span>Back to Teams</span>
                        </button>
                    </div>

                    <div className="board-title-section">
                        <h1>Team Space</h1>
                        <div className="board-actions">
                            <div className="member-avatars">
                                {members.slice(0, 3).map(m => (
                                    <div key={m.user._id} className="avatar-circle-wrapper">
                                        <div className="avatar-circle" title={`${m.user.name} (${m.user.email})`}>
                                            {m.user.name.charAt(0)}
                                        </div>
                                        {user?._id === members[0]?.user?._id && m.user._id !== user._id && (
                                            <button className="remove-member-btn" onClick={() => handleRemoveMember(m.user._id)} title="Remove Member">
                                                <X size={10} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {members.length > 3 && <div className="avatar-circle extra">+{members.length - 3}</div>}
                                <button className="add-member-mini" onClick={() => setShowMemberForm(true)}>
                                    <UserPlus size={16} />
                                </button>
                            </div>
                            <div className="search-box">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <button className="secondary-btn" onClick={fetchActivityLogs} title="View Activity">
                                <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
                                <span>Activity</span>
                            </button>
                            <button className="add-task-btn" onClick={() => setShowTaskForm(true)}>
                                <Plus size={18} />
                                <span>Add Task</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="board-content container">
                <div className="kanban-grid">
                    {columns.map(column => (
                        <div key={column.id} className="kanban-column">
                            <div className="column-header">
                                <div className="column-title">
                                    <span className="dot" style={{ background: column.color }}></span>
                                    <h2>{column.title}</h2>
                                    <span className="count">
                                        {tasks.filter(t => t.status === column.id).length}
                                    </span>
                                </div>
                            </div>

                            <div className="tasks-list">
                                {tasks.filter(t => t.status === column.id).map(task => (
                                    <div key={task._id} className="task-card" onClick={() => setSelectedTask(task)}>
                                        <div className="task-card-header">
                                            <h3>{task.title}</h3>
                                        </div>
                                        <p className="task-desc">{task.description}</p>

                                        <div className="task-card-footer">
                                            <div className="task-assigned">
                                                <div className="mini-avatar">
                                                    {task.assignedTo?.name?.charAt(0) || '?'}
                                                </div>
                                                <span>{task.assignedTo?.name || 'Unassigned'}</span>
                                            </div>
                                            <div className="task-meta">
                                                <MessageSquare size={14} />
                                                <span>{task.comments?.length || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Modals */}
            {showTaskForm && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2>Create New Task</h2>
                            <button onClick={() => setShowTaskForm(false)} className="icon-btn"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateTask}>
                            <div className="input-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Description</label>
                                <textarea
                                    rows="3"
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="input-group">
                                <label>Assign To</label>
                                <select
                                    value={newTask.assignedTo}
                                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                >
                                    <option value="">Select Member</option>
                                    {members.map(m => (
                                        <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="confirm-btn">Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showMemberForm && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2>Add Team Member</h2>
                            <button onClick={() => setShowMemberForm(false)} className="icon-btn"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddMember}>
                            <div className="input-group">
                                <label>Member Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter name..."
                                    required
                                    value={newMemberName}
                                    onChange={(e) => setNewMemberName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="input-group">
                                <label>User Email</label>
                                <input
                                    type="email"
                                    placeholder="friend@example.com"
                                    required
                                    value={newMemberEmail}
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="confirm-btn" disabled={addingMember}>
                                    {addingMember ? <Loader2 className="spinner" size={18} /> : 'Add Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedTask && (
                <div className="modal-overlay">
                    <div className="modal-card task-details-modal">
                        <div className="modal-header">
                            <div className="status-badge" style={{ background: columns.find(c => c.id === selectedTask.status).color }}>
                                {selectedTask.status}
                            </div>
                            <button onClick={() => setSelectedTask(null)} className="icon-btn"><X size={20} /></button>
                        </div>

                        <div className="task-details-content">
                            <h1>{selectedTask.title}</h1>
                            <p className="description">{selectedTask.description}</p>

                            <div className="details-grid">
                                <div className="detail-item">
                                    <label>Assigned To</label>
                                    <div className="user-pill">
                                        <div className="mini-avatar">{selectedTask.assignedTo?.name?.charAt(0) || '?'}</div>
                                        <span>{selectedTask.assignedTo?.name || 'Unassigned'}</span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <label>Actions</label>
                                    <div className="move-actions-horizontal">
                                        {columns.map(c => (
                                            <button
                                                key={c.id}
                                                className={selectedTask.status === c.id ? 'active' : ''}
                                                onClick={() => handleMoveTask(selectedTask._id, c.id)}
                                            >
                                                {c.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="comments-section">
                                <h3>Comments ({selectedTask.comments?.length || 0})</h3>
                                <div className="comments-list">
                                    {selectedTask.comments?.map((c, i) => (
                                        <div key={i} className="comment-item">
                                            <div className="comment-meta">
                                                <strong>{c.createdBy?.name || 'User'}</strong>
                                                <span>{new Date(c.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <p>{c.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleAddComment} className="comment-form">
                                    <input
                                        type="text"
                                        placeholder="Add a comment..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                    />
                                    <button type="submit"><Send size={18} /></button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showActivity && (
                <div className="modal-overlay">
                    <div className="modal-card activity-modal">
                        <div className="modal-header">
                            <h2>Team Activity Log</h2>
                            <button onClick={() => setShowActivity(false)} className="icon-btn"><X size={20} /></button>
                        </div>
                        <div className="activity-list">
                            {fetchingLogs ? <Loader2 className="spinner" /> : activityLogs.length > 0 ? (
                                activityLogs.map((log, i) => (
                                    <div key={i} className="activity-item">
                                        <div className="activity-dot"></div>
                                        <div className="activity-info">
                                            <p><strong>{log.performedBy?.name}</strong> {log.action.toLowerCase()} task "<em>{log.task?.title}</em>"</p>
                                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))
                            ) : <p>No activity recorded yet.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Board;
