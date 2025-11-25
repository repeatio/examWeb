import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { parseExcelFile, validateExcelFile } from '../utils/excelParser';
import { saveQuestionBank } from '../utils/db';

export default function ExcelUploader({ onUploadSuccess }) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleFile = async (file) => {
        setError('');
        setSuccess('');

        if (!validateExcelFile(file)) {
            setError('请上传有效的Excel文件 (.xlsx 或 .xls)');
            return;
        }

        setUploading(true);

        try {
            const { name, questions } = await parseExcelFile(file);

            const questionBank = {
                id: `qb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name,
                createdAt: Date.now(),
                questions,
            };

            await saveQuestionBank(questionBank);

            setSuccess(`成功导入题库 "${name}"，共 ${questions.length} 道题目`);

            if (onUploadSuccess) {
                onUploadSuccess();
            }

            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            setError(err.message || '导入失败，请检查文件格式');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    };

    return (
        <div className="card">
            <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
                <FileSpreadsheet className="w-7 h-7 text-purple-400" />
                <span>导入题库</span>
            </h2>

            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${isDragging
                        ? 'border-purple-400 bg-purple-500/10'
                        : 'border-white/30 hover:border-white/50 bg-white/5'
                    }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-purple-400' : 'text-gray-400'}`} />

                <p className="text-lg mb-2">
                    {isDragging ? '释放文件以上传' : '拖拽Excel文件到此处'}
                </p>

                <p className="text-sm text-gray-400 mb-4">
                    或
                </p>

                <label className="btn-primary cursor-pointer inline-block">
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileInput}
                        className="hidden"
                        disabled={uploading}
                    />
                    {uploading ? '导入中...' : '选择文件'}
                </label>

                <div className="mt-6 text-sm text-gray-400 text-left space-y-1">
                    <p className="font-semibold text-white mb-2">📋 Excel格式要求：</p>
                    <p>• 列1: 题目类型（选择题/判断题）</p>
                    <p>• 列2: 题目内容</p>
                    <p>• 列3-6: 选项A、B、C、D（判断题可留空）</p>
                    <p>• 列7: 正确答案</p>
                    <p>• 列8: 解析（可选）</p>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-400/50 rounded-lg flex items-start space-x-3 animate-slide-up">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-200">{error}</p>
                </div>
            )}

            {success && (
                <div className="mt-4 p-4 bg-green-500/20 border border-green-400/50 rounded-lg flex items-start space-x-3 animate-slide-up">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-green-200">{success}</p>
                </div>
            )}
        </div>
    );
}
