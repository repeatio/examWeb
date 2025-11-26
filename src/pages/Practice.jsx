import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Home, BarChart3 } from 'lucide-react';
import QuestionCard from '../components/QuestionCard';
import ProgressBar from '../components/ProgressBar';
import { shuffleArray } from '../utils/shuffle';
import { saveAnswerRecord, saveWrongQuestion, removeWrongQuestion, savePracticeProgress, getPracticeProgress, deletePracticeProgress } from '../utils/db';

export default function Practice() {
    const location = useLocation();
    const navigate = useNavigate();
    const { questionBank, mode, isWrongQuestions, resume } = location.state || {};

    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isFinished, setIsFinished] = useState(false);
    const [stats, setStats] = useState({ correct: 0, wrong: 0 });
    const [loading, setLoading] = useState(true);

    // Load questions and progress
    useEffect(() => {
        const initPractice = async () => {
            if (!questionBank || !questionBank.questions) {
                navigate('/');
                return;
            }

            let initialQuestions = [];
            let initialIndex = 0;
            let initialAnswers = {};
            let initialStats = { correct: 0, wrong: 0 };

            // Try to resume if requested
            if (resume) {
                try {
                    const progress = await getPracticeProgress(questionBank.id);
                    if (progress) {
                        initialQuestions = progress.questions;
                        initialIndex = progress.currentIndex;
                        initialAnswers = progress.answers;
                        initialStats = progress.stats;
                    }
                } catch (error) {
                    console.error('Failed to load progress:', error);
                }
            }

            // If no progress loaded or not resuming, initialize fresh
            if (initialQuestions.length === 0) {
                initialQuestions = mode === 'random'
                    ? shuffleArray(questionBank.questions)
                    : questionBank.questions;
            }

            setQuestions(initialQuestions);
            setCurrentIndex(initialIndex);
            setAnswers(initialAnswers);
            setStats(initialStats);
            setLoading(false);
        };

        initPractice();
    }, [questionBank, mode, navigate, resume]);

    // Save progress whenever state changes
    useEffect(() => {
        if (!loading && !isFinished && questions.length > 0 && !isWrongQuestions) {
            const saveProgress = async () => {
                try {
                    await savePracticeProgress({
                        questionBankId: questionBank.id,
                        questions,
                        currentIndex,
                        answers,
                        stats,
                        timestamp: Date.now(),
                    });
                } catch (error) {
                    console.error('Failed to save progress:', error);
                }
            };
            saveProgress();
        }
    }, [questions, currentIndex, answers, stats, isFinished, loading, questionBank, isWrongQuestions]);

    const handleAnswer = async (answer, isCorrect) => {
        const currentQuestion = questions[currentIndex];

        // Save answer
        setAnswers(prev => ({
            ...prev,
            [currentIndex]: { answer, isCorrect }
        }));

        // Update stats
        setStats(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            wrong: prev.wrong + (isCorrect ? 0 : 1),
        }));

        // Save answer record
        await saveAnswerRecord({
            questionBankId: questionBank.id,
            questionId: currentQuestion.id,
            userAnswer: answer,
            isCorrect,
            timestamp: Date.now(),
        });

        // Handle wrong question collection
        if (!isCorrect) {
            const wrongQuestion = {
                id: `${questionBank.id}_${currentQuestion.id}`,
                questionBankId: questionBank.id,
                questionBankName: questionBank.name,
                question: currentQuestion,
                wrongCount: 1,
                lastWrongTime: Date.now(),
            };
            await saveWrongQuestion(wrongQuestion);
        } else {
            // If answered correctly, remove from wrong questions if it exists
            await removeWrongQuestion(`${questionBank.id}_${currentQuestion.id}`);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else if (!isFinished) {
            setIsFinished(true);
            // Clear progress when finished
            if (!isWrongQuestions) {
                await deletePracticeProgress(questionBank.id);
            }
        }
    };

    const handleRestart = async () => {
        // Clear progress
        if (!isWrongQuestions) {
            await deletePracticeProgress(questionBank.id);
        }

        setCurrentIndex(0);
        setAnswers({});
        setIsFinished(false);
        setStats({ correct: 0, wrong: 0 });

        const questionsList = mode === 'random'
            ? shuffleArray(questionBank.questions)
            : questionBank.questions;

        setQuestions(questionsList);
    };

    const handleExit = async () => {
        navigate('/');
    };

    if (loading || !questionBank || questions.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="card max-w-2xl mx-auto text-center py-12">
                    <p className="text-gray-400 text-lg mb-4">加载中...</p>
                </div>
            </div>
        );
    }

    if (isFinished) {
        const accuracy = questions.length > 0
            ? Math.round((stats.correct / questions.length) * 100)
            : 0;

        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="card text-center animate-fade-in">
                        {/* Completion Banner */}
                        <div className="mb-8">
                            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BarChart3 className="w-12 h-12 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold mb-2">答题完成！</h1>
                            <p className="text-gray-400">恭喜完成本次练习</p>
                        </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white/5 rounded-xl p-6">
                                <p className="text-gray-400 text-sm mb-1">总题数</p>
                                <p className="text-4xl font-bold text-purple-400">{questions.length}</p>
                            </div>
                            <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-6">
                                <p className="text-gray-400 text-sm mb-1">正确</p>
                                <p className="text-4xl font-bold text-green-400">{stats.correct}</p>
                            </div>
                            <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-6">
                                <p className="text-gray-400 text-sm mb-1">错误</p>
                                <p className="text-4xl font-bold text-red-400">{stats.wrong}</p>
                            </div>
                        </div>

                        {/* Accuracy */}
                        <div className="mb-8">
                            <p className="text-gray-400 text-sm mb-2">正确率</p>
                            <div className="flex items-center justify-center space-x-4">
                                <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden max-w-md">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-1000"
                                        style={{ width: `${accuracy}%` }}
                                    />
                                </div>
                                <span className="text-3xl font-bold text-green-400">{accuracy}%</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={handleRestart}
                                className="btn-primary flex items-center justify-center space-x-2"
                            >
                                <span>再练一次</span>
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="btn-secondary flex items-center justify-center space-x-2"
                            >
                                <Home className="w-5 h-5" />
                                <span>返回首页</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const currentAnswer = answers[currentIndex];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={handleExit}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>退出</span>
                    </button>

                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-gray-300">{questionBank.name}</h2>
                        {isWrongQuestions && (
                            <span className="text-sm text-orange-400">错题集模式</span>
                        )}
                    </div>

                    <div className="w-20"></div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <ProgressBar current={currentIndex + 1} total={questions.length} />
                </div>

                {/* Question Card */}
                <QuestionCard
                    key={currentQuestion.id}
                    question={currentQuestion}
                    questionNumber={currentIndex + 1}
                    totalQuestions={questions.length}
                    onAnswer={handleAnswer}
                    showResult={!!currentAnswer}
                    userAnswer={currentAnswer?.answer}
                />

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 max-w-4xl mx-auto">
                    <button
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className={`btn-secondary flex items-center space-x-2 ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span>上一题</span>
                    </button>

                    <div className="text-center">
                        <p className="text-sm text-gray-400">
                            已答 <span className="text-purple-400 font-bold">{Object.keys(answers).length}</span> / {questions.length}
                        </p>
                    </div>

                    <button
                        onClick={handleNext}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <span>{currentIndex === questions.length - 1 ? '完成' : '下一题'}</span>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

