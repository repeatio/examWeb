// Import JSON files
import judgeQuestions from '../../assets/jsonData/判断题.json';
import choiceQuestions from '../../assets/jsonData/选择题.json';
import { saveQuestionBank } from './db';

/**
 * Get all preset question banks from JSON files
 * @returns {Array} Array of question bank objects
 */
export function getPresetQuestionBanks() {
    return [judgeQuestions, choiceQuestions];
}

/**
 * Load preset question banks into IndexedDB
 * Checks if database is empty before loading to avoid duplicates
 * @param {Array} existingBanks - Existing question banks from DB
 * @returns {Promise<{ loaded: boolean, count: number }>}
 */
export async function loadPresetQuestionBanks(existingBanks = []) {
    try {
        // If there are already question banks, don't auto-load
        if (existingBanks.length > 0) {
            console.log('题库已存在，跳过自动加载');
            return { loaded: false, count: 0 };
        }

        const presetBanks = getPresetQuestionBanks();
        console.log(`开始自动加载 ${presetBanks.length} 个预设题库...`);

        let loadedCount = 0;

        for (const bank of presetBanks) {
            const questionBank = {
                id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: bank.name,
                questions: bank.questions,
                createdAt: new Date().toISOString(),
            };

            await saveQuestionBank(questionBank);
            console.log(`✅ 已加载题库: ${bank.name} (${bank.questions.length} 道题目)`);
            loadedCount++;
        }

        console.log(`🎉 成功自动加载 ${loadedCount} 个题库`);
        return { loaded: true, count: loadedCount };

    } catch (error) {
        console.error('自动加载题库失败:', error);
        return { loaded: false, count: 0, error: error.message };
    }
}
