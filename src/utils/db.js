import { openDB } from 'idb';

const DB_NAME = 'ExamWebDB';
const DB_VERSION = 2;

// Initialize the database
export async function initDB() {
    const db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            // Question Banks Store
            if (!db.objectStoreNames.contains('questionBanks')) {
                db.createObjectStore('questionBanks', { keyPath: 'id' });
            }

            // Answer Records Store
            if (!db.objectStoreNames.contains('answerRecords')) {
                const store = db.createObjectStore('answerRecords', { keyPath: 'id', autoIncrement: true });
                store.createIndex('questionBankId', 'questionBankId');
                store.createIndex('questionId', 'questionId');
            }

            // Wrong Questions Store
            if (!db.objectStoreNames.contains('wrongQuestions')) {
                const store = db.createObjectStore('wrongQuestions', { keyPath: 'id' });
                store.createIndex('questionBankId', 'questionBankId');
            }

            // Practice Progress Store
            if (!db.objectStoreNames.contains('practiceProgress')) {
                db.createObjectStore('practiceProgress', { keyPath: 'questionBankId' });
            }
        },
    });
    return db;
}

// Question Bank CRUD Operations
export async function saveQuestionBank(questionBank) {
    const db = await initDB();
    await db.put('questionBanks', questionBank);
}

export async function getAllQuestionBanks() {
    const db = await initDB();
    return await db.getAll('questionBanks');
}

export async function getQuestionBankById(id) {
    const db = await initDB();
    return await db.get('questionBanks', id);
}

export async function deleteQuestionBank(id) {
    const db = await initDB();
    const tx = db.transaction(['questionBanks', 'answerRecords', 'wrongQuestions', 'practiceProgress'], 'readwrite');

    // Delete the question bank
    await tx.objectStore('questionBanks').delete(id);

    // Delete related answer records
    const answerStore = tx.objectStore('answerRecords');
    const answerIndex = answerStore.index('questionBankId');
    let cursor = await answerIndex.openCursor(IDBKeyRange.only(id));
    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }

    // Delete related wrong questions
    const wrongStore = tx.objectStore('wrongQuestions');
    const wrongIndex = wrongStore.index('questionBankId');
    cursor = await wrongIndex.openCursor(IDBKeyRange.only(id));
    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }

    // Delete related progress
    await tx.objectStore('practiceProgress').delete(id);

    await tx.done;
}

// Answer Record Operations
export async function saveAnswerRecord(record) {
    const db = await initDB();
    await db.add('answerRecords', record);
}

export async function getAnswerRecords(questionBankId) {
    const db = await initDB();
    const tx = db.transaction('answerRecords', 'readonly');
    const index = tx.objectStore('answerRecords').index('questionBankId');
    return await index.getAll(IDBKeyRange.only(questionBankId));
}

// Wrong Question Operations
export async function saveWrongQuestion(wrongQuestion) {
    const db = await initDB();
    const existing = await db.get('wrongQuestions', wrongQuestion.id);

    if (existing) {
        // Update wrong count
        existing.wrongCount += 1;
        existing.lastWrongTime = wrongQuestion.lastWrongTime;
        await db.put('wrongQuestions', existing);
    } else {
        await db.put('wrongQuestions', wrongQuestion);
    }
}

export async function removeWrongQuestion(id) {
    const db = await initDB();
    await db.delete('wrongQuestions', id);
}

export async function getAllWrongQuestions() {
    const db = await initDB();
    return await db.getAll('wrongQuestions');
}

export async function getWrongQuestionsByBankId(questionBankId) {
    const db = await initDB();
    const tx = db.transaction('wrongQuestions', 'readonly');
    const index = tx.objectStore('wrongQuestions').index('questionBankId');
    return await index.getAll(IDBKeyRange.only(questionBankId));
}

export async function clearAllWrongQuestions() {
    const db = await initDB();
    await db.clear('wrongQuestions');
}

export async function clearWrongQuestionsByBankId(questionBankId) {
    const db = await initDB();
    const tx = db.transaction('wrongQuestions', 'readwrite');
    const index = tx.objectStore('wrongQuestions').index('questionBankId');
    let cursor = await index.openCursor(IDBKeyRange.only(questionBankId));

    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }

    await tx.done;
}

// Practice Progress Operations
export async function savePracticeProgress(progress) {
    const db = await initDB();
    await db.put('practiceProgress', progress);
}

export async function getPracticeProgress(questionBankId) {
    const db = await initDB();
    return await db.get('practiceProgress', questionBankId);
}

export async function deletePracticeProgress(questionBankId) {
    const db = await initDB();
    await db.delete('practiceProgress', questionBankId);
}

export async function getAllPracticeProgress() {
    const db = await initDB();
    return await db.getAll('practiceProgress');
}

