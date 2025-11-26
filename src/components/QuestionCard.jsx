import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

export default function QuestionCard({
    question,
    questionNumber,
    totalQuestions,
    onAnswer,
    showResult,
    userAnswer
}) {
    const [selectedOption, setSelectedOption] = useState(userAnswer || '');
    const [hasAnswered, setHasAnswered] = useState(showResult || false);

    // Reset state when question changes
    useEffect(() => {
        setSelectedOption(userAnswer || '');
        setHasAnswered(showResult || false);
    }, [question.id, userAnswer, showResult]);

    const handleOptionClick = (option) => {
        if (hasAnswered) return;

        setSelectedOption(option);
        setHasAnswered(true);

        const isCorrect = option === question.answer;

        if (onAnswer) {
            onAnswer(option, isCorrect);
        }
    };

    const getOptionClass = (option) => {
        if (!hasAnswered) {
            return selectedOption === option ? 'option-selected' : '';
        }

        // Show correct answer
        if (option === question.answer) {
            return 'option-correct';
        }

        // Show wrong answer if user selected it
        if (option === selectedOption && option !== question.answer) {
            return 'option-wrong';
        }

        return '';
    };

    const getOptionLabel = (index) => {
        return String.fromCharCode(65 + index); // A, B, C, D
    };

    return (
        <div className="card max-w-4xl mx-auto animate-fade-in">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
                <span className="text-sm font-medium text-gray-400">
                    题目 {questionNumber} / {totalQuestions}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${question.type === 'choice'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-purple-500/20 text-purple-300'
                    }`}>
                    {question.type === 'choice' ? '选择题' : '判断题'}
                </span>
            </div>

            {/* Question Content */}
            <div className="mb-6">
                <p className="text-xl leading-relaxed">{question.content}</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
                {question.type === 'choice' ? (
                    // Choice Question Options
                    question.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleOptionClick(getOptionLabel(index))}
                            disabled={hasAnswered}
                            className={`option-button ${getOptionClass(getOptionLabel(index))}`}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold">
                                    {getOptionLabel(index)}
                                </span>
                                <span className="flex-1 text-left">{option}</span>
                                {hasAnswered && getOptionLabel(index) === question.answer && (
                                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                                )}
                                {hasAnswered && getOptionLabel(index) === selectedOption && getOptionLabel(index) !== question.answer && (
                                    <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                                )}
                            </div>
                        </button>
                    ))
                ) : (
                    // Judge Question Options
                    <>
                        <button
                            onClick={() => handleOptionClick('对')}
                            disabled={hasAnswered}
                            className={`option-button ${getOptionClass('对')}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold">✓ 对</span>
                                {hasAnswered && '对' === question.answer && (
                                    <Check className="w-5 h-5 text-green-400" />
                                )}
                                {hasAnswered && '对' === selectedOption && '对' !== question.answer && (
                                    <X className="w-5 h-5 text-red-400" />
                                )}
                            </div>
                        </button>
                        <button
                            onClick={() => handleOptionClick('错')}
                            disabled={hasAnswered}
                            className={`option-button ${getOptionClass('错')}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold">✗ 错</span>
                                {hasAnswered && '错' === question.answer && (
                                    <Check className="w-5 h-5 text-green-400" />
                                )}
                                {hasAnswered && '错' === selectedOption && '错' !== question.answer && (
                                    <X className="w-5 h-5 text-red-400" />
                                )}
                            </div>
                        </button>
                    </>
                )}
            </div>

            {/* Result Feedback */}
            {hasAnswered && (
                <div className="mt-6 pt-6 border-t border-white/20 animate-slide-up">
                    <div className={`p-4 rounded-xl mb-4 ${selectedOption === question.answer
                        ? 'bg-green-500/20 border border-green-400/50'
                        : 'bg-red-500/20 border border-red-400/50'
                        }`}>
                        <div className="flex items-center space-x-2 mb-2">
                            {selectedOption === question.answer ? (
                                <>
                                    <Check className="w-6 h-6 text-green-400" />
                                    <span className="font-bold text-green-300 text-lg">回答正确！</span>
                                </>
                            ) : (
                                <>
                                    <X className="w-6 h-6 text-red-400" />
                                    <span className="font-bold text-red-300 text-lg">回答错误</span>
                                </>
                            )}
                        </div>
                        <p className="text-sm">
                            正确答案：<span className="font-bold">{question.answer}</span>
                        </p>
                    </div>

                    {question.explanation && (
                        <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                            <p className="text-sm font-semibold text-blue-300 mb-2">📖 解析</p>
                            <p className="text-gray-300">{question.explanation}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
