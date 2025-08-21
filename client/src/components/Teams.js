import { useState, useEffect } from "react";

const Teams = ({ teams, setTeam, onTeamSelect, onTeamDelete, onTeamEdit }) => {
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [newTeamName, setNewTeamName] = useState("");

    const handleCreateTeam = () => {
        if (newTeamName.trim()) {
            // This will be implemented in the next commit
            console.log("Creating team:", newTeamName);
            setNewTeamName("");
            setShowCreateForm(false);
        }
    };

    const handleEditTeam = (team) => {
        setEditingTeam(team);
        setShowEditForm(true);
    };

    const handleSaveEdit = () => {
        if (editingTeam && editingTeam.name.trim()) {
            // This will be implemented in the next commit
            console.log("Saving edited team:", editingTeam);
            setShowEditForm(false);
            setEditingTeam(null);
        }
    };

    const handleDeleteTeam = (teamId) => {
        if (window.confirm("Are you sure you want to delete this team?")) {
            // This will be implemented in the next commit
            console.log("Deleting team:", teamId);
        }
    };

    return (
        <div className="Teams-Section">
            <div className="Teams-Header">
                <h2>TEAMS</h2>
                <button 
                    className="Create-Team-Button"
                    onClick={() => setShowCreateForm(true)}
                >
                    + New Team
                </button>
            </div>

            {/* Create Team Form */}
            {showCreateForm && (
                <div className="Team-Form-Overlay">
                    <div className="Team-Form">
                        <h3>Create New Team</h3>
                        <input
                            type="text"
                            placeholder="Enter team name..."
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className="Team-Name-Input"
                            autoFocus
                        />
                        <div className="Form-Actions">
                            <button 
                                onClick={handleCreateTeam}
                                className="Save-Button"
                                disabled={!newTeamName.trim()}
                            >
                                Create
                            </button>
                            <button 
                                onClick={() => setShowCreateForm(false)}
                                className="Cancel-Button"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Team Form */}
            {showEditForm && editingTeam && (
                <div className="Team-Form-Overlay">
                    <div className="Team-Form">
                        <h3>Edit Team</h3>
                        <input
                            type="text"
                            value={editingTeam.name}
                            onChange={(e) => setEditingTeam({...editingTeam, name: e.target.value})}
                            className="Team-Name-Input"
                            autoFocus
                        />
                        <div className="Form-Actions">
                            <button 
                                onClick={handleSaveEdit}
                                className="Save-Button"
                                disabled={!editingTeam.name.trim()}
                            >
                                Save
                            </button>
                            <button 
                                onClick={() => setShowEditForm(false)}
                                className="Cancel-Button"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Teams List */}
            <div className="Teams-List">
                {teams.length === 0 ? (
                    <div className="No-Teams">
                        <p>No teams yet. Create your first team!</p>
                    </div>
                ) : (
                    teams.map((team) => (
                        <div 
                            key={team.id} 
                            className={`Team-Item ${selectedTeamId === team.id ? 'selected' : ''}`}
                        >
                            <div className="Team-Info">
                                <h4>{team.name}</h4>
                                <p className="Team-Date">
                                    {new Date(team.updated_at || team.created_at).toLocaleDateString()}
                                </p>
                                <p className="Team-Pokemon-Count">
                                    {team.pokemon_data?.filter(p => p !== null).length || 0} Pokémon
                                </p>
                            </div>
                            
                            <div className="Team-Actions">
                                <button 
                                    onClick={() => onTeamSelect(team)}
                                    className="Select-Team-Button"
                                >
                                    Load
                                </button>
                                <button 
                                    onClick={() => handleEditTeam(team)}
                                    className="Edit-Team-Button"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDeleteTeam(team.id)}
                                    className="Delete-Team-Button"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Teams;
