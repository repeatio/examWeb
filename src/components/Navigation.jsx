import React from 'react';
import { Home, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
    const location = useLocation();

    // We hide the top navigation on small screens when the user is on the
    // answering/practice page (e.g. /practice/:bankId) to avoid duplicate header
    // content above the page's own "退出" button.
    const isPracticeRoute = location.pathname.startsWith('/practice/');

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <nav className={`bg-white/10 backdrop-blur-md border-b border-white/20 ${isPracticeRoute ? 'hidden sm:block' : ''}`}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            刷题练习系统
                        </span>
                    </Link>

                    <div className="flex space-x-2">
                        <Link
                            to="/"
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive('/')
                                    ? 'bg-white/20 text-white'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <Home className="w-5 h-5" />
                            <span className="hidden sm:inline">首页</span>
                        </Link>

                        <Link
                            to="/wrong-questions"
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive('/wrong-questions')
                                    ? 'bg-white/20 text-white'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <BookOpen className="w-5 h-5" />
                            <span className="hidden sm:inline">错题集</span>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
