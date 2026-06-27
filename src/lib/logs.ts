// In-memory ring buffer for logs

const MAX_LOGS = 200;
const logBuffer: { timestamp: number; message: string; type: 'info' | 'error' | 'warn' }[] = [];

export function addLog(message: string, type: 'info' | 'error' | 'warn' = 'info') {
  logBuffer.push({ timestamp: Date.now(), message, type });
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift();
  }
}

export function getLogs() {
  return [...logBuffer];
}

export function clearLogs() {
  logBuffer.length = 0;
}
