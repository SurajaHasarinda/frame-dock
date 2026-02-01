import React, { useState } from 'react';
import { Key, Save, Loader2, CheckCircle, XCircle, User } from 'lucide-react';
import { api } from '../api';

const SettingsPage: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [newUsername, setNewUsername] = useState('');
    const [usernamePassword, setUsernamePassword] = useState('');
    const [usernameLoading, setUsernameLoading] = useState(false);
    const [usernameMessage, setUsernameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
            return;
        }

        setLoading(true);

        try {
            await api.changePassword(currentPassword, newPassword);

            setMessage({ type: 'success', text: 'Password changed successfully' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    const handleUsernameChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setUsernameMessage(null);

        if (!newUsername.trim()) {
            setUsernameMessage({ type: 'error', text: 'Username cannot be empty' });
            return;
        }

        if (newUsername.length < 3) {
            setUsernameMessage({ type: 'error', text: 'Username must be at least 3 characters long' });
            return;
        }

        setUsernameLoading(true);

        try {
            await api.changeUsername(newUsername, usernamePassword);

            setUsernameMessage({ type: 'success', text: 'Username changed successfully' });
            setNewUsername('');
            setUsernamePassword('');
        } catch (error: any) {
            setUsernameMessage({ type: 'error', text: error.message || 'Failed to change username' });
        } finally {
            setUsernameLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h2 className="text-2xl font-bold text-white">Settings</h2>
                <p className="text-slate-400 text-sm">Manage your account and application preferences.</p>
            </div>

            {/* Password Change Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-docker/10 rounded-lg">
                        <Key size={20} className="text-docker" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Change Password</h3>
                        <p className="text-xs text-slate-500">Update your account password</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    {message && (
                        <div className={`px-4 py-3 rounded-xl flex items-center gap-3 ${message.type === 'success'
                            ? 'bg-success/10 border border-success/50 text-success'
                            : 'bg-red-500/10 border border-red-500/50 text-red-500'
                            }`}>
                            {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            <span className="text-sm font-medium">{message.text}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto px-6 py-3 bg-docker hover:bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-docker/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>

            {/* Username Change Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-docker/10 rounded-lg">
                        <User size={20} className="text-docker" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Change Username</h3>
                        <p className="text-xs text-slate-500">Update your account username</p>
                    </div>
                </div>

                <form onSubmit={handleUsernameChange} className="space-y-4">
                    {usernameMessage && (
                        <div className={`px-4 py-3 rounded-xl flex items-center gap-3 ${usernameMessage.type === 'success'
                            ? 'bg-success/10 border border-success/50 text-success'
                            : 'bg-red-500/10 border border-red-500/50 text-red-500'
                            }`}>
                            {usernameMessage.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            <span className="text-sm font-medium">{usernameMessage.text}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">New Username</label>
                        <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            placeholder="Enter new username"
                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Confirm Password</label>
                        <input
                            type="password"
                            value={usernamePassword}
                            onChange={(e) => setUsernamePassword(e.target.value)}
                            placeholder="Enter your password to confirm"
                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-docker transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={usernameLoading}
                        className="w-full md:w-auto px-6 py-3 bg-docker hover:bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-docker/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {usernameLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {usernameLoading ? 'Saving...' : 'Change Username'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage;
