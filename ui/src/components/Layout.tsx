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
    Menu,
    X,
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

    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const navItems = [
        { name: 'Containers', path: '/', icon: <Box size={20} /> },
        { name: 'Stats', path: '/stats', icon: <Activity size={20} /> },
        { name: 'Schedules', path: '/schedules', icon: <Calendar size={20} /> },
        { name: 'Images', path: '/images', icon: <Layers size={20} /> },
        { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
            {/* Sidebar Desktop */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-col hidden md:flex">
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
                                    ? 'bg-blue-500/10 text-blue-400'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                }`
                            }
                        >
                            {/* ... icon render code ... */}
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
                        <div className="flex flex-col overflow-hidden">
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

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <aside className="relative w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-200">
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src="/frame-dock.svg" alt="Frame Dock" className="w-8 h-8" />
                                <h1 className="text-xl font-bold tracking-tight text-white">Frame Dock</h1>
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-blue-500/10 text-blue-400'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                        }`
                                    }
                                >
                                    {item.icon}
                                    <span className="font-medium">{item.name}</span>
                                    <ChevronRight size={14} className="ml-auto opacity-50" />
                                </NavLink>
                            ))}
                        </nav>

                        <div className="p-4 mt-auto border-t border-slate-800">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 mb-3">
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                                    <User size={16} />
                                </div>
                                <div className="flex flex-col overflow-hidden">
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
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative w-full">
                {/* Header for mobile */}
                <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        <span className="font-bold text-white text-lg">Frame Dock</span>
                    </div>
                    <div className="w-8 h-8">
                        {/* Placeholder or user avatar if needed */}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 w-full">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
