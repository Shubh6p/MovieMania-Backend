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
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/\[(.*?)\]\s(.+)/);
      if (!match) return null;
      const ts = new Date(match[1]).getTime();
      return isNaN(ts) ? null : { timestamp: ts, message: match[2] };
    })
    .filter(Boolean);
}

function deleteNotificationsByTimestamps(indexes = []){
  if (!fs.existsSync(logFile)) return;
  const lines = fs.readFileSync(logFile, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
    
  const filtered = lines.filter(line => {
    const match = line.match(/\[(.*?)\]/);
    if (!match) return false;
    const ts = new Date(match[1]).getTime();
    return isNaN(ts) ? false : !indexes.includes(ts);
  });
  
  if (filtered.length === 0) {
    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
  } else {
    fs.writeFileSync(logFile, filtered.join('\n') + '\n');
  }
}

module.exports = { logNotification, readNotifications, deleteNotificationsByTimestamps };
