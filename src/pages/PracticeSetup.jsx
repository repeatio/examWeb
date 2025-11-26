import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shuffle, List, ArrowLeft, Play } from 'lucide-react';

export default function PracticeSetup() {
    const location = useLocation();
    const navigate = useNavigate();
    const { questionBank, isWrongQuestions } = location.state || {};

    const [mode, setMode] = useState('sequential');

    if (!questionBank) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="card max-w-2xl mx-auto text-center py-12">
                    <p className="text-gray-400 text-lg mb-4">未找到题库信息</p>
                    <button onClick={() => navigate('/')} className="btn-primary">
                        返回首页
                    </button>
                </div>
            </div>
        );
    }

    const handleStart = () => {
        navigate(`/practice/${questionBank.id}`, {
            state: {
                questionBank,
                mode,
                isWrongQuestions
            }
        });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>返回</span>
                </button>

                <div className="card">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">
                            {isWrongQuestions ? '错题集练习' : '答题设置'}
                        </h1>
                        <p className="text-gray-400">选择答题模式后开始练习</p>
                    </div>

                    {/* Question Bank Info */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
                        <h2 className="text-xl font-bold mb-4">{questionBank.name}</h2>
                        <div className="flex items-center space-x-6 text-gray-300">
                            <div>
                                <span className="text-sm text-gray-400">题目数量</span>
                                <p className="text-2xl font-bold text-purple-400">
                                    {questionBank.questions?.length || 0}
                                </p>
                            </div>
                            {isWrongQuestions && (
                                <div>
                                    <span className="text-sm text-gray-400">题库来源</span>
                                    <p className="text-sm font-medium">错题集</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">选择答题模式</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Sequential Mode */}
                            <div
                                onClick={() => setMode('sequential')}
                                className={`card-hover cursor-pointer ${mode === 'sequential'
                                    ? 'bg-purple-500/20 border-purple-400'
                                    : 'bg-white/5'
                                    }`}
                            >
                                <div className="flex items-start space-x-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mode === 'sequential'
                                        ? 'bg-purple-500'
                                        : 'bg-white/10'
                                        }`}>
                                        <List className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold mb-1">顺序模式</h4>
                                        <p className="text-sm text-gray-400">
                                            按照题库原有顺序依次答题
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Random Mode */}
                            <div
                                onClick={() => setMode('random')}
                                className={`card-hover cursor-pointer ${mode === 'random'
                                    ? 'bg-purple-500/20 border-purple-400'
                                    : 'bg-white/5'
                                    }`}
                            >
                                <div className="flex items-start space-x-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mode === 'random'
                                        ? 'bg-purple-500'
                                        : 'bg-white/10'
                                        }`}>
                                        <Shuffle className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold mb-1">乱序模式</h4>
                                        <p className="text-sm text-gray-400">
                                            随机打乱题目顺序，增加练习难度
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={handleStart}
                        className="w-full btn-primary flex items-center justify-center space-x-2 text-lg py-4"
                    >
                        <Play className="w-6 h-6" />
                        <span>开始答题</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
