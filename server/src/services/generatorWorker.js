const { parentPort, workerData } = require('worker_threads');
const { autoGenerate } = require('./generatorService');
const { connectDB } = require('../config/db');

async function run() {
  try {
    await connectDB();

    const { versionId, institutionId } = workerData;

    console.log(`[Worker Thread]: Потік активовано. Початок розрахунку CSP для версії: ${versionId}`);

    const result = await autoGenerate(versionId, institutionId);

    parentPort.postMessage({ success: true, data: result });
  } catch (error) {
    console.error('Worker Thread Critical Error:', error.message);
    parentPort.postMessage({ success: false, error: error.message });
  } finally {
    console.log(`[Worker Thread]: Роботу завершено. Безпечне закриття каналу.`);
    parentPort.close();
  }
}

run();