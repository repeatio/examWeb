import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse Excel file and extract questions (same logic as excelParser.js)
 */
function parseExcelFile(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);

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
            throw new Error('未能从Excel文件中解析出有效题目');
        }

        // Get file name without extension
        const fileName = path.basename(filePath, path.extname(filePath));

        return {
            name: fileName,
            questions,
        };

    } catch (error) {
        throw new Error(`解析Excel文件失败: ${error.message}`);
    }
}

/**
 * Main conversion function
 */
function convertExcelToJson() {
    const assetsDir = path.join(__dirname, '../assets');
    const outputDir = path.join(assetsDir, 'jsonData');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`✅ 创建输出目录: ${outputDir}`);
    }

    // Get all Excel files
    const files = fs.readdirSync(assetsDir);
    const excelFiles = files.filter(file =>
        file.endsWith('.xlsx') || file.endsWith('.xls')
    );

    if (excelFiles.length === 0) {
        console.log('⚠️  未找到Excel文件');
        return;
    }

    console.log(`\n📚 找到 ${excelFiles.length} 个Excel文件\n`);

    let successCount = 0;
    let failCount = 0;

    // Process each Excel file
    excelFiles.forEach(file => {
        const filePath = path.join(assetsDir, file);
        const outputFileName = path.basename(file, path.extname(file)) + '.json';
        const outputPath = path.join(outputDir, outputFileName);

        try {
            console.log(`📖 正在处理: ${file}`);
            const questionBank = parseExcelFile(filePath);

            // Write JSON file
            fs.writeFileSync(
                outputPath,
                JSON.stringify(questionBank, null, 2),
                'utf-8'
            );

            console.log(`✅ 成功转换: ${outputFileName} (${questionBank.questions.length} 道题目)`);
            successCount++;

        } catch (error) {
            console.error(`❌ 转换失败: ${file}`);
            console.error(`   错误: ${error.message}`);
            failCount++;
        }
    });

    console.log(`\n📊 转换完成: ${successCount} 成功, ${failCount} 失败\n`);
}

// Run the conversion
convertExcelToJson();
