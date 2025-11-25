import React from 'react';

export default function ProgressBar({ current, total }) {
    const percentage = total > 0 ? (current / total) * 100 : 0;

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-300">答题进度</span>
                <span className="text-sm font-bold text-purple-400">
                    {current} / {total}
                </span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
