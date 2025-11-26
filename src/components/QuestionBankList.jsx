import React, { useState, useEffect } from 'react';
import { BookOpen, Trash2, Play, Calendar, FileText, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deleteQuestionBank, getPracticeProgress } from '../utils/db';

export default function QuestionBankList({ questionBanks, onDelete }) {
    const navigate = useNavigate();
    const [deletingId, setDeletingId] = useState(null);
    const [progressMap, setProgressMap] = useState({});

    useEffect(() => {
        const loadProgress = async () => {
            const map = {};
            for (const bank of questionBanks) {
                try {
                    const progress = await getPracticeProgress(bank.id);
                    if (progress) {
                        map[bank.id] = progress;
                    }
                } catch (error) {
                    console.error(`Failed to load progress for bank ${bank.id}:`, error);
                }
            }
            setProgressMap(map);
        };

        if (questionBanks.length > 0) {
            loadProgress();
        }
    }, [questionBanks]);

    const handleDelete = async (e, id) => {
        e.stopPropagation();

        if (!confirm('确定要删除这个题库吗？相关的答题记录也会被删除。')) {
            return;
        }

        setDeletingId(id);

        try {
            await deleteQuestionBank(id);
            if (onDelete) {
                onDelete();
            }
        } catch (error) {
            alert('删除失败: ' + error.message);
        } finally {
            setDeletingId(null);
        }
    };

    const handleStartPractice = (bank, resume = false) => {
        navigate('/practice-setup', { state: { questionBank: bank, resume } });
    };

    const handleContinuePractice = (e, bank) => {
        e.stopPropagation();
        // Skip setup and go directly to practice
        navigate(`/practice/${bank.id}`, {
            state: {
                questionBank: bank,
                mode: 'sequence', // Default to sequence when resuming, though Practice.jsx will use saved questions
                resume: true
            }
        });
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    if (!questionBanks || questionBanks.length === 0) {
        return (
            <div className="card text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400 text-lg">暂无题库，请先导入Excel文件</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
                <BookOpen className="w-7 h-7 text-blue-400" />
                <span>我的题库</span>
                <span className="text-sm font-normal text-gray-400">({questionBanks.length})</span>
            </h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {questionBanks.map((bank) => {
                    const hasProgress = !!progressMap[bank.id];
                    const progress = progressMap[bank.id];

                    return (
                        <div
                            key={bank.id}
                            className="card-hover group"
                            onClick={() => handleStartPractice(bank)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg truncate group-hover:text-purple-400 transition-colors">
                                            {bank.name}
                                        </h3>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => handleDelete(e, bank.id)}
                                    disabled={deletingId === bank.id}
                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                                    title="删除题库"
                                >
                                    <Trash2 className="w-5 h-5 text-red-400" />
                                </button>
                            </div>

                            <div className="space-y-2 text-sm text-gray-300 mb-4">
                                <div className="flex items-center space-x-2">
                                    <BookOpen className="w-4 h-4 text-blue-400" />
                                    <span>共 {bank.questions.length} 道题目</span>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-purple-400" />
                                    <span>创建于 {formatDate(bank.createdAt)}</span>
                                </div>

                                {hasProgress && (
                                    <div className="flex items-center space-x-2 text-green-400">
                                        <RotateCcw className="w-4 h-4" />
                                        <span>已答 {progress.currentIndex} / {progress.questions.length} 题</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-2">
                                {hasProgress ? (
                                    <>
                                        <button
                                            onClick={(e) => handleContinuePractice(e, bank)}
                                            className="flex-1 btn-primary flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                        >
                                            <Play className="w-4 h-4" />
                                            <span>继续</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartPractice(bank);
                                            }}
                                            className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            <span>重开</span>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartPractice(bank);
                                        }}
                                        className="w-full btn-primary flex items-center justify-center space-x-2"
                                    >
                                        <Play className="w-5 h-5" />
                                        <span>开始练习</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

