import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, ChevronRight, Loader2, X, UserPlus } from 'lucide-react';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const [teams, setTeams] = useState([]);
    const [newTeamName, setNewTeamName] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [memberEmail, setMemberEmail] = useState('');
    const [memberName, setMemberName] = useState('');
    const [addingMember, setAddingMember] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            fetchTeams();
        }
    }, [user]);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const res = await api.get('/teams');
            setTeams(res.data.teams || []);
        } catch (err) {
            console.error('Failed to fetch teams', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;
        setCreating(true);
        try {
            const res = await api.post('/teams/create', { name: newTeamName });
            setTeams([...teams, res.data.team]);
            setNewTeamName('');
            setShowModal(false);
        } catch (err) {
            alert('Failed to create team');
        } finally {
            setCreating(false);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!memberEmail.trim() || !memberName.trim()) return;
        setAddingMember(true);
        try {
            const res = await api.post(`/teams/${selectedTeamId}/invite`, {
                name: memberName,
                email: memberEmail
            });

            alert(res.data.message || 'Member added successfully');
            setMemberEmail('');
            setMemberName('');
            setShowMemberModal(false);
            fetchTeams();
        } catch (err) {
            console.error('Invite Error:', err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
            alert(`Failed to add member: ${errorMsg}`);
        } finally {
            setAddingMember(false);
        }
    };

    if (loading) return <div className="loading-container"><Loader2 className="spinner" /></div>;

    return (
        <div className="container dashboard fade-in">
            <header className="dashboard-header">
                <div>
                    <h1>Welcome, {user?.name}</h1>
                    <p>Manage your teams and collaborate on tasks</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="secondary-btn" onClick={() => fetchTeams()} title="Refresh Teams">
                        <Loader2 size={18} className={loading ? 'spinner' : ''} />
                        <span>Refresh</span>
                    </button>
                    <button className="primary-btn" onClick={() => setShowModal(true)}>
                        <Plus size={18} />
                        <span>Create New Team</span>
                    </button>
                </div>
            </header>

            <div className="teams-grid">
                {teams.length > 0 ? (
                    teams.map(team => (
                        <div key={team._id} className="team-card fade-in">
                            <div className="card-click-area" onClick={() => navigate(`/team/${team._id}`)}>
                                <div className="team-icon">
                                    <Users size={24} />
                                </div>
                                <div className="team-info">
                                    <h3>{team.name}</h3>
                                    <p>{team.members?.length || 0} members</p>
                                </div>
                            </div>
                            <div className="card-actions">
                                <button className="add-member-btn" onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTeamId(team._id);
                                    setShowMemberModal(true);
                                }} title="Add Member">
                                    <UserPlus size={18} />
                                    <span style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}>Member</span>
                                </button>
                                <ChevronRight className="arrow" size={20} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <Users size={48} />
                        <h3>No teams yet</h3>
                        <p>Create your first team to start collaborating</p>
                    </div>
                )}
            </div>

            {/* Create Team Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2>Create New Team</h2>
                            <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateTeam}>
                            <div className="input-group">
                                <label>Team Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter team name..."
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="confirm-btn" disabled={creating}>
                                    {creating ? <Loader2 className="spinner" size={18} /> : 'Create Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showMemberModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2>Add Team Member</h2>
                            <button className="icon-btn" onClick={() => setShowMemberModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddMember}>
                            <div className="input-group">
                                <label>Member Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter user name..."
                                    value={memberName}
                                    onChange={(e) => setMemberName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="input-group">
                                <label>Member Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter user email..."
                                    value={memberEmail}
                                    onChange={(e) => setMemberEmail(e.target.value)}
                                    required
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
        </div>
    );
};

export default Dashboard;
