/**
 * Parse Excel file and extract questions
 * @param {File} file - The Excel file to parse
 * @returns {Promise<{name: string, questions: Array}>} - Parsed question bank
 */
export async function parseExcelFile(file) {
    // Dynamically import xlsx to avoid adding it to the initial bundle
    const mod = await import('xlsx');
    const XLSX = mod.default ?? mod;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get the first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Parse questions
                const questions = [];

                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i];

                    // Skip empty rows or rows with less than 7 columns
                    if (!row || row.length < 7) continue;

                    const [type, content, optionA, optionB, optionC, optionD, answer, explanation] = row;

                    // Skip if essential fields are empty
                    if (!type || !content || !answer) continue;

                    const questionType = type.toString().trim();

                    // Validate question type
                    if (questionType !== '选择题' && questionType !== '判断题') {
                        console.warn(`第 ${i + 1} 行: 未知的题目类型 "${questionType}", 已跳过`);
                        continue;
                    }

                    const question = {
                        id: `q_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
                        type: questionType === '选择题' ? 'choice' : 'judge',
                        content: content.toString().trim(),
                        answer: answer.toString().trim(),
                        explanation: explanation ? explanation.toString().trim() : '',
                    };

                    // Add options for choice questions
                    if (question.type === 'choice') {
                        question.options = [
                            optionA ? optionA.toString().trim() : '',
                            optionB ? optionB.toString().trim() : '',
                            optionC ? optionC.toString().trim() : '',
                            optionD ? optionD.toString().trim() : '',
                        ].filter(opt => opt !== '');

                        // Validate that we have at least 2 options
                        if (question.options.length < 2) {
                            console.warn(`第 ${i + 1} 行: 选择题选项不足, 已跳过`);
                            continue;
                        }
                    }

                    questions.push(question);
                }

                if (questions.length === 0) {
                    reject(new Error('未能从Excel文件中解析出有效题目，请检查文件格式'));
                    return;
                }

                // Get file name without extension
                const fileName = file.name.replace(/\.[^/.]+$/, '');

                resolve({
                    name: fileName,
                    questions,
                });

            } catch (error) {
                reject(new Error(`解析Excel文件失败: ${error.message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('读取文件失败'));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Validate Excel file format
 * @param {File} file - The file to validate
 * @returns {boolean} - True if valid
 */
export function validateExcelFile(file) {
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
}
