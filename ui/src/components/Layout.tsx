import React, { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Box,
    Calendar,
    Layers,
    Settings,
    LogOut,
    ChevronRight,
    User,
    Activity,
} from 'lucide-react';
import { api } from '../api';

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    const navigate = useNavigate();
    const username = api.getCurrentUser();

    const handleLogout = () => {
        api.logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Containers', path: '/', icon: <Box size={20} /> },
        { name: 'Stats', path: '/stats', icon: <Activity size={20} /> },
        { name: 'Schedules', path: '/schedules', icon: <Calendar size={20} /> },
        { name: 'Images', path: '/images', icon: <Layers size={20} /> },
        { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
                <div className="p-6 flex items-center gap-3">
                    <img src="/frame-dock.svg" alt="Frame Dock" className="w-8 h-8" />
                    <h1 className="text-xl font-bold tracking-tight text-white">Frame Dock</h1>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-docker/10 text-docker'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="font-medium">{item.name}</span>
                            <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 mt-auto border-t border-slate-800">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 mb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                            <User size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white truncate">{username}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Admin Role</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header for mobile */}
                <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <img src="/frame-dock.svg" alt="Frame Dock" className="w-8 h-8" />
                        <span className="font-bold text-white">Frame Dock</span>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-slate-400">
                        <LogOut size={20} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
