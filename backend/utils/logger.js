const fs = require('fs');
const path = require('path');

const logFile = path.resolve(__dirname, '..', 'notifications.log');

function logNotification(message){
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
}

function readNotifications(){
  if (!fs.existsSync(logFile)) return [];
  return fs.readFileSync(logFile, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const match = line.match(/\[(.*?)\]\s(.+)/);
      return { timestamp: new Date(match[1]).getTime(), message: match[2] };
    });
}

function deleteNotificationsByTimestamps(indexes = []){
  if (!fs.existsSync(logFile)) return;
  const lines = fs.readFileSync(logFile, 'utf-8').split('\n');
  const filtered = lines.filter(line => {
    const match = line.match(/\[(.*?)\]/);
    const ts = match ? new Date(match[1]).getTime() : null;
    return ts ? !indexes.includes(ts) : true;
  });
  fs.writeFileSync(logFile, filtered.join('\n') + '\n');
}

module.exports = { logNotification, readNotifications, deleteNotificationsByTimestamps };
