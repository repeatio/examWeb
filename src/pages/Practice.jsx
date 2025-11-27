import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Home, BarChart3 } from 'lucide-react';
import QuestionCard from '../components/QuestionCard';
import ProgressBar from '../components/ProgressBar';
import { shuffleArray } from '../utils/shuffle';
import { saveAnswerRecord, saveWrongQuestion, removeWrongQuestion, savePracticeProgress, getPracticeProgress, deletePracticeProgress, getQuestionBankById, getAllWrongQuestions, markQuestionAsAnswered, getUnansweredQuestions } from '../utils/db';

export default function Practice() {
    const location = useLocation();
    const navigate = useNavigate();
    const { bankId } = useParams();
    const autoAdvanceTimerRef = useRef(null);
    const [searchParams] = useSearchParams();
    const { questionBank: stateQuestionBank, mode: stateMode, isWrongQuestions: stateIsWrongQuestions, resume: stateResume } = location.state || {};
    const paramMode = searchParams.get('mode');
    const paramWrong = searchParams.get('wrong') === '1';

    // Use state if available, otherwise fallback to loading
    const [questionBank, setQuestionBank] = useState(stateQuestionBank || null);
    const [mode, setMode] = useState(stateMode || paramMode || 'sequential');
    const [isWrongQuestions, setIsWrongQuestions] = useState(stateIsWrongQuestions || paramWrong || false);
    const [resume, setResume] = useState(stateResume || false);

    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isFinished, setIsFinished] = useState(false);
    const [stats, setStats] = useState({ correct: 0, wrong: 0 });
    const [loading, setLoading] = useState(true);

    // Load questions and progress
    useEffect(() => {
        const initPractice = async () => {
            let currentBank = questionBank;
            let currentMode = mode;
            let currentIsWrongQuestions = isWrongQuestions;
            let currentResume = resume;

            // If no state, try to load from DB based on URL params
            if (!currentBank && bankId) {
                try {
                    // Check if it's "all wrong questions" or a specific bank
                    // Note: We might need to infer isWrongQuestions from the ID or some other way if it's not passed in state
                    // For now, let's assume if we are reloading, we might need to check if the ID matches a known pattern or check DB

                    if (bankId === 'all_wrong_questions') {
                        const wrongQuestions = await getAllWrongQuestions();
                        if (wrongQuestions.length > 0) {
                            currentBank = {
                                id: 'all_wrong_questions',
                                name: '全部错题',
                                questions: wrongQuestions.map(wq => wq.question),
                            };
                            currentIsWrongQuestions = true;
                            setIsWrongQuestions(true);
                        }
                    } else {
                        // Try to fetch regular question bank
                        const bank = await getQuestionBankById(bankId);
                        if (bank) {
                            currentBank = bank;
                            // If we found the bank, we assume it's NOT wrong questions mode unless we have other info
                            // But wait, if it WAS wrong questions mode for a specific bank, the ID passed in URL is just the bank ID?
                            // No, in WrongQuestions.jsx we constructed a synthetic bank object but the ID was the bank ID.
                            // However, we didn't change the URL structure for wrong questions mode.
                            // If we are in wrong questions mode, we probably want to know that.
                            // But standard practice URL is /practice/:bankId.
                            // If we refresh, we lose "isWrongQuestions" flag.
                            // We can check if there are query params, or we can try to infer.
                            // Let's check search params for mode/type if we want to be robust, but for now let's just load the bank.

                            // Actually, if it's wrong questions mode, we constructed a special bank object with ONLY wrong questions.
                            // If we reload and just fetch the full bank, we lose the "wrong questions only" filter.
                            // This is a limitation. We should probably add query params to the URL to persist these flags.
                        } else {
                            // Could be a wrong questions bank with a composite ID? 
                            // In WrongQuestions.jsx: id: bankQuestions.id (which is bankId)
                            // So it uses the real bank ID.
                            // If we are in wrong questions mode, we need to know to filter for wrong questions.
                            // Let's look at searchParams.
                        }
                    }

                    if (currentBank) {
                        setQuestionBank(currentBank);
                    }
                } catch (error) {
                    console.error("Failed to load question bank on refresh:", error);
                }
            }

            if (!currentBank || !currentBank.questions) {
                // If still no bank, we can't proceed
                // But wait, if we are loading async, we shouldn't redirect immediately if we are still trying to fetch
                if (!bankId) {
                    navigate('/');
                    return;
                }
                // If we have bankId but failed to load, we might want to show error or redirect
                // But let's give it a chance to load if we are in the "loading from ID" phase
                if (!questionBank && bankId) {
                    // We are waiting for the async fetch above to finish setting state
                    // Actually, the logic above is inside this async function.
                    // So if we are here and currentBank is null, we failed.
                    navigate('/');
                    return;
                }
            }

            // Re-fetch wrong questions if we detected we should be in wrong questions mode but only loaded the full bank
            // This is tricky without query params. 
            // Ideally we should have put ?isWrongQuestions=true in the URL.
            // Let's assume for now we just load the full bank if it's a normal bank ID.
            // If the user was doing "Wrong Questions" for a specific bank, and refreshes, they might get the full bank.
            // To fix this properly, we should update PracticeSetup to pass these as query params too.

            let initialQuestions = [];
            let initialIndex = 0;
            let initialAnswers = {};
            let initialStats = { correct: 0, wrong: 0 };

            // Try to resume if requested
            // If we refreshed, we might want to auto-resume or just start over?
            // Usually if you refresh a practice page, you expect to stay where you were.
            // So we should try to load progress.

            // If we have stateResume, use it. If not (refresh), maybe we should check progress anyway?
            // If we are reloading, we definitely want to restore state if possible.

            const shouldResume = currentMode === 'sequential' || currentResume || (!stateQuestionBank && bankId); // For sequential mode, try to resume by default

            if (shouldResume) {
                try {
                    const progress = await getPracticeProgress(currentBank.id);
                    if (progress) {
                        initialQuestions = progress.questions;
                        initialIndex = progress.currentIndex;
                        initialAnswers = progress.answers;
                        initialStats = progress.stats;

                        // Restore mode and wrong-flag from saved progress if available
                        if (progress.mode) currentMode = progress.mode;
                        if (typeof progress.isWrongQuestions !== 'undefined') currentIsWrongQuestions = progress.isWrongQuestions;

                        // If we successfully loaded progress, we should also restore the questions from the progress
                        // because the progress saves the specific list of questions (shuffled or wrong questions subset)
                    }
                } catch (error) {
                    console.error('Failed to load progress:', error);
                }
            }

            // If no progress loaded or not resuming, initialize fresh
            if (initialQuestions.length === 0) {
                // If random mode, prefer unanswered questions only (shuffle them). If none unanswered, fall back to full list.
                if (currentMode === 'random') {
                    try {
                        const unanswered = await getUnansweredQuestions(currentBank.id);
                        const baseList = (unanswered && unanswered.length > 0) ? unanswered : currentBank.questions;
                        initialQuestions = shuffleArray(baseList);
                    } catch (err) {
                        console.error('Failed to load unanswered questions:', err);
                        initialQuestions = shuffleArray(currentBank.questions);
                    }
                } else {
                    // sequential
                    initialQuestions = currentBank.questions;
                }
            }

            setQuestions(initialQuestions);
            setCurrentIndex(initialIndex);
            setAnswers(initialAnswers);
            setStats(initialStats);
            // Make sure component state reflects resolved mode/flags
            setMode(currentMode);
            setIsWrongQuestions(currentIsWrongQuestions);
            setLoading(false);
        };

        initPractice();
    }, [bankId, navigate, stateQuestionBank, stateMode, stateIsWrongQuestions, stateResume]);

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
                            mode: currentMode,
                            isWrongQuestions: currentIsWrongQuestions,
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

        // Mark question as answered in stored question bank
        try {
            await markQuestionAsAnswered(questionBank.id, currentQuestion.id);
        } catch (err) {
            console.error('Failed to mark question as answered:', err);
        }

        // Update local questions state to reflect answered flag so UI updates immediately
        setQuestions(prev => prev.map((q, idx) => q.id === currentQuestion.id ? { ...q, answered: true } : q));

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

        // Auto-advance to next question when answered correctly
        if (isCorrect) {
            // clear any existing timer
            if (autoAdvanceTimerRef.current) {
                clearTimeout(autoAdvanceTimerRef.current);
            }

            // small delay so user can see the correct feedback
            autoAdvanceTimerRef.current = setTimeout(() => {
                autoAdvanceTimerRef.current = null;
                handleNext();
            }, 700);
        }
    };

    // clear timer on unmount
    useEffect(() => {
        return () => {
            if (autoAdvanceTimerRef.current) {
                clearTimeout(autoAdvanceTimerRef.current);
                autoAdvanceTimerRef.current = null;
            }
        };
    }, []);

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
        <div className="container mx-auto px-4 py-4 sm:py-8">
            <div className="max-w-5xl mx-auto pb-24 sm:pb-0">
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
                    showResult={!!currentAnswer || !!currentQuestion.answered}
                    userAnswer={currentAnswer?.answer}
                />

                {/* Navigation */}
                <div className="mt-8 max-w-4xl mx-auto">
                    {/* Desktop / tablet: normal flow */}
                    <div className="hidden sm:flex items-center justify-between">
                        <button
                            onClick={handlePrevious}
                            disabled={currentIndex === 0}
                            className={`btn-secondary flex items-center space-x-2 ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span>上一题</span>
                        </button>

                        <div className="text-center">
                            <p className="text-sm text-gray-400">已答 <span className="text-purple-400 font-bold">{Object.keys(answers).length}</span> / {questions.length}</p>
                        </div>

                        <button
                            onClick={handleNext}
                            className="btn-primary flex items-center space-x-2"
                        >
                            <span>{currentIndex === questions.length - 1 ? '完成' : '下一题'}</span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mobile: fixed bottom nav so it's visible when explanation expands */}
                    <div className="sm:hidden fixed left-4 right-4 bottom-4 z-50 bg-white/5 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between shadow-lg">
                        <button
                            onClick={handlePrevious}
                            disabled={currentIndex === 0}
                            className={`btn-secondary flex items-center space-x-2 ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-sm">上一题</span>
                        </button>

                        <div className="text-center px-2">
                            <p className="text-xs text-gray-300">已答 <span className="text-purple-400 font-bold">{Object.keys(answers).length}</span> / {questions.length}</p>
                        </div>

                        <button
                            onClick={handleNext}
                            className="btn-primary flex items-center space-x-2"
                        >
                            <span className="text-sm">{currentIndex === questions.length - 1 ? '完成' : '下一题'}</span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

