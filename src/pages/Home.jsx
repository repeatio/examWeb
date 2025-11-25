import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import ExcelUploader from '../components/ExcelUploader';
import QuestionBankList from '../components/QuestionBankList';
import { getAllQuestionBanks, getAllWrongQuestions } from '../utils/db';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const [questionBanks, setQuestionBanks] = useState([]);
    const [wrongQuestionsCount, setWrongQuestionsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadData = async () => {
        setLoading(true);
        try {
            const banks = await getAllQuestionBanks();
            const wrongQuestions = await getAllWrongQuestions();
            setQuestionBanks(banks);
            setWrongQuestionsCount(wrongQuestions.length);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        欢迎来到刷题练习系统
                    </h1>
                    <p className="text-gray-300 text-lg">
                        导入题库，开始练习，轻松掌握知识点
                    </p>
                </div>

                {/* Wrong Questions Quick Access */}
                {wrongQuestionsCount > 0 && (
                    <div
                        onClick={() => navigate('/wrong-questions')}
                        className="card-hover bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-400/30 cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                                    <BookOpen className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">错题集</h3>
                                    <p className="text-gray-400">您有 {wrongQuestionsCount} 道错题待复习</p>
                                </div>
                            </div>
                            <button className="btn-primary">
                                开始复习
                            </button>
                        </div>
                    </div>
                )}

                {/* Excel Uploader */}
                <ExcelUploader onUploadSuccess={loadData} />

                {/* Question Banks List */}
                {loading ? (
                    <div className="card text-center py-12">
                        <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-400">加载中...</p>
                    </div>
                ) : (
                    <QuestionBankList questionBanks={questionBanks} onDelete={loadData} />
                )}
            </div>
        </div>
    );
}
