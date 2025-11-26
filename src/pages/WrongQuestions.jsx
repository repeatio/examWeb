import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Trash2, Play, Calendar, AlertCircle } from 'lucide-react';
import { getAllWrongQuestions, clearAllWrongQuestions, clearWrongQuestionsByBankId } from '../utils/db';

export default function WrongQuestions() {
    const [wrongQuestions, setWrongQuestions] = useState([]);
    const [groupedQuestions, setGroupedQuestions] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadWrongQuestions = async () => {
        setLoading(true);
        try {
            const questions = await getAllWrongQuestions();
            setWrongQuestions(questions);

            // Group by question bank
            const grouped = questions.reduce((acc, wq) => {
                if (!acc[wq.questionBankId]) {
                    acc[wq.questionBankId] = {
                        id: wq.questionBankId,
                        name: wq.questionBankName,
                        questions: [],
                    };
                }
                acc[wq.questionBankId].questions.push(wq);
                return acc;
            }, {});

            setGroupedQuestions(grouped);
        } catch (error) {
            console.error('Failed to load wrong questions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWrongQuestions();
    }, []);

    const handleClearAll = async () => {
        if (!confirm('确定要清空所有错题吗？此操作不可恢复。')) {
            return;
        }

        try {
            await clearAllWrongQuestions();
            loadWrongQuestions();
        } catch (error) {
            alert('清空失败: ' + error.message);
        }
    };

    const handleClearBank = async (e, questionBankId) => {
        e.stopPropagation();

        if (!confirm('确定要清空该题库的错题吗？')) {
            return;
        }

        try {
            await clearWrongQuestionsByBankId(questionBankId);
            loadWrongQuestions();
        } catch (error) {
            alert('清空失败: ' + error.message);
        }
    };

    const handlePractice = (bankQuestions) => {
        const questionBank = {
            id: bankQuestions.id,
            name: bankQuestions.name + ' - 错题集',
            questions: bankQuestions.questions.map(wq => wq.question),
        };

        navigate('/practice-setup', {
            state: {
                questionBank,
                isWrongQuestions: true
            }
        });
    };

    const handlePracticeAll = () => {
        if (wrongQuestions.length === 0) return;

        const questionBank = {
            id: 'all_wrong_questions',
            name: '全部错题',
            questions: wrongQuestions.map(wq => wq.question),
        };

        navigate('/practice-setup', {
            state: {
                questionBank,
                isWrongQuestions: true
            }
        });
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-4 sm:py-8">
                <div className="card text-center py-12">
                    <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">加载中...</p>
                </div>
            </div>
        );
    }

    if (wrongQuestions.length === 0) {
        return (
            <div className="container mx-auto px-4 py-4 sm:py-8">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl font-bold mb-8">错题集</h1>

                    <div className="card text-center py-12">
                        <BookOpen className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                        <p className="text-gray-400 text-lg mb-2">暂无错题</p>
                        <p className="text-gray-500 text-sm">继续练习，答错的题目会自动添加到这里</p>
                        <button
                            onClick={() => navigate('/')}
                            className="btn-primary mt-6"
                        >
                            返回首页
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-4 sm:py-8">
            <div className="max-w-6xl mx-auto pb-24 sm:pb-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">错题集</h1>
                        <p className="text-gray-400">
                            共 {wrongQuestions.length} 道错题
                        </p>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handlePracticeAll}
                            className="btn-primary flex items-center space-x-2"
                        >
                            <Play className="w-5 h-5" />
                            <span>练习全部</span>
                        </button>

                        <button
                            onClick={handleClearAll}
                            className="btn-secondary flex items-center space-x-2 hover:bg-red-500/20 hover:border-red-400"
                        >
                            <Trash2 className="w-5 h-5" />
                            <span>清空全部</span>
                        </button>
                    </div>
                </div>

                {/* Statistics Card */}
                <div className="card mb-8 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-400/30">
                    <div className="flex items-center space-x-3">
                        <AlertCircle className="w-8 h-8 text-orange-400" />
                        <div>
                            <p className="text-lg font-semibold">错题提示</p>
                            <p className="text-sm text-gray-400">
                                重复练习错题可以有效提高掌握程度，答对后错题会自动从列表中移除
                            </p>
                        </div>
                    </div>
                </div>

                {/* Grouped Wrong Questions */}
                <div className="space-y-6">
                    {Object.entries(groupedQuestions).map(([bankId, bankData]) => (
                        <div key={bankId} className="card">
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/20">
                                <div>
                                    <h2 className="text-2xl font-bold">{bankData.name}</h2>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {bankData.questions.length} 道错题
                                    </p>
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handlePractice(bankData)}
                                        className="btn-primary flex items-center space-x-2"
                                    >
                                        <Play className="w-5 h-5" />
                                        <span>开始练习</span>
                                    </button>

                                    <button
                                        onClick={(e) => handleClearBank(e, bankId)}
                                        className="btn-secondary flex items-center space-x-2 hover:bg-red-500/20 hover:border-red-400"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Wrong Questions List */}
                            <div className="space-y-3">
                                {bankData.questions.map((wq, index) => (
                                    <div
                                        key={wq.id}
                                        className="bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all duration-200"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-semibold">
                                                        {wq.question.type === 'choice' ? '选择题' : '判断题'}
                                                    </span>
                                                    <span className="text-sm text-gray-400">
                                                        答错 {wq.wrongCount} 次
                                                    </span>
                                                </div>
                                                <p className="text-white mb-2">{wq.question.content}</p>
                                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>最后答错: {formatDate(wq.lastWrongTime)}</span>
                                                    </div>
                                                    <span>正确答案: {wq.question.answer}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
