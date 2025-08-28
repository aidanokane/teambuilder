import { useState } from "react";

const Teams = ({ teams, onTeamSelect, onTeamDelete, onTeamUpdate }) => {
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null); // Track which team is being deleted
    const [isUpdating, setIsUpdating] = useState(null); // Track which team is being updated

    // Ensure teams is always an array
    const safeTeams = Array.isArray(teams) ? teams : [];

    const handleEditTeam = (team) => {
        setEditingTeam({...team}); // Create a copy to avoid mutating original
        setShowEditForm(true);
    };

    const handleSaveEdit = async () => {
        if (!editingTeam || !editingTeam.name.trim()) {
            alert('Please enter a valid team name');
            return;
        }

        if (!onTeamUpdate) {
            console.error('onTeamUpdate function not provided');
            alert('Update team function not available');
            return;
        }

        try {
            setIsUpdating(editingTeam.id);
            console.log('Updating team name:', editingTeam.id, editingTeam.name);

            const result = await onTeamUpdate(editingTeam.id, editingTeam.name.trim());

            if (result && result.success) {
                console.log('Team updated successfully:', result.team);
                setShowEditForm(false);
                setEditingTeam(null);
            } else {
                alert(`Failed to update team: ${result?.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating team:', error);
            alert('Error updating team. Please try again.');
        } finally {
            setIsUpdating(null);
        }
    };

    const handleDeleteTeam = async (teamId, teamName) => {
        if (!window.confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
            return;
        }

        if (!onTeamDelete) {
            console.error('onTeamDelete function not provided');
            alert('Delete team function not available');
            return;
        }

        try {
            setIsDeleting(teamId);
            console.log('Deleting team:', teamId);

            const result = await onTeamDelete(teamId);

            if (result && result.success) {
                console.log('Team deleted successfully');
            } else {
                alert(`Failed to delete team: ${result?.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting team:', error);
            alert('Error deleting team. Please try again.');
        } finally {
            setIsDeleting(null);
        }
    };

    const handleSelectTeam = (team) => {
        if (!onTeamSelect) {
            console.error('onTeamSelect function not provided');
            alert('Select team function not available');
            return;
        }

        console.log('Loading team:', team.name);
        onTeamSelect(team);
    };

    // Helper function to safely get pokemon count
    const getPokemonCount = (team) => {
        if (!team || !team.pokemon_data) return 0;
        if (Array.isArray(team.pokemon_data)) {
            return team.pokemon_data.filter(p => p !== null && p !== undefined).length;
        }
        return 0;
    };

    // Helper function to safely get team date
    const getTeamDate = (team) => {
        if (!team) return 'Unknown';
        const date = team.updated_at || team.created_at;
        if (!date) return 'Unknown';
        try {
            return new Date(date).toLocaleDateString();
        } catch (e) {
            return 'Unknown';
        }
    };

    return (
        <div className="Teams-Section">
            <div className="Teams-Header">
                <h2>TEAMS</h2>
            </div>

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
                            disabled={isUpdating === editingTeam.id}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && isUpdating !== editingTeam.id) {
                                    handleSaveEdit();
                                }
                            }}
                        />
                        <div className="Form-Actions">
                            <button
                                onClick={handleSaveEdit}
                                className="Save-Button"
                                disabled={!editingTeam.name.trim() || isUpdating === editingTeam.id}
                            >
                                {isUpdating === editingTeam.id ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowEditForm(false);
                                    setEditingTeam(null);
                                }}
                                className="Cancel-Button"
                                disabled={isUpdating === editingTeam.id}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Teams List */}
            <div className="Teams-List">
                {safeTeams.length === 0 ? (
                    <div className="No-Teams">
                        <p>No teams yet. Create your first team!</p>
                    </div>
                ) : (
                    safeTeams.map((team) => (
                        <div
                            key={team.id}
                            className={`Team-Item ${editingTeam?.id === team.id ? 'selected' : ''}`}
                        >
                            <div className="Team-Info">
                                <h4>{team.name}</h4>
                                <p className="Team-Date">
                                    {getTeamDate(team)}
                                </p>
                                <p className="Team-Pokemon-Count">
                                    {getPokemonCount(team)} Pokémon
                                </p>
                            </div>

                            <div className="Team-Actions">
                                <button
                                    onClick={() => handleSelectTeam(team)}
                                    className="Select-Team-Button"
                                    disabled={!onTeamSelect}
                                >
                                    Load
                                </button>
                                <button
                                    onClick={() => handleEditTeam(team)}
                                    className="Edit-Team-Button"
                                    disabled={isUpdating === team.id || isDeleting === team.id}
                                >
                                    {isUpdating === team.id ? 'Updating...' : 'Edit'}
                                </button>
                                <button
                                    onClick={() => handleDeleteTeam(team.id, team.name)}
                                    className="Delete-Team-Button"
                                    disabled={isDeleting === team.id || isUpdating === team.id}
                                >
                                    {isDeleting === team.id ? 'Deleting...' : 'Delete'}
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