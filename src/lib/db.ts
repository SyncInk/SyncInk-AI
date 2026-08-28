import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure data dir exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Initialize DB if not exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: {}, conversations: {}, messages: {}, settings: {} }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const db = {
  getConversations: (userId: string) => {
    const data = readDB();
    return Object.values(data.conversations).filter((c: any) => c.userId === userId).sort((a: any, b: any) => b.updatedAt - a.updatedAt);
  },
  getConversation: (id: string, userId: string) => {
    const data = readDB();
    const conv = data.conversations[id];
    if (conv && conv.userId === userId) {
      const messages = Object.values(data.messages).filter((m: any) => m.conversationId === id).sort((a: any, b: any) => a.createdAt - b.createdAt);
      return { ...conv, messages };
    }
    return null;
  },
  createConversation: (userId: string, title: string, customId?: string) => {
    const data = readDB();
    const id = customId || Date.now().toString();
    const conv = { id, userId, title, createdAt: Date.now(), updatedAt: Date.now() };
    data.conversations[id] = conv;
    writeDB(data);
    return conv;
  },
  updateConversation: (id: string, userId: string, updates: any) => {
    const data = readDB();
    const conv = data.conversations[id];
    if (conv && conv.userId === userId) {
      data.conversations[id] = { ...conv, ...updates, updatedAt: Date.now() };
      writeDB(data);
      return data.conversations[id];
    }
    return null;
  },
  deleteConversation: (id: string, userId: string) => {
    const data = readDB();
    const conv = data.conversations[id];
    if (conv && conv.userId === userId) {
      delete data.conversations[id];
      // delete messages
      for (const mId in data.messages) {
        if (data.messages[mId].conversationId === id) delete data.messages[mId];
      }
      writeDB(data);
      return true;
    }
    return false;
  },
  saveMessage: (userId: string, conversationId: string, message: any) => {
    const data = readDB();
    const conv = data.conversations[conversationId];
    if (conv && conv.userId === userId) {
      const id = message.id || Date.now().toString() + Math.random().toString();
      data.messages[id] = { ...message, id, conversationId, createdAt: Date.now() };
      data.conversations[conversationId].updatedAt = Date.now();
      writeDB(data);
      return data.messages[id];
    }
    return null;
  },
  saveMessages: (userId: string, conversationId: string, messages: any[]) => {
    const data = readDB();
    const conv = data.conversations[conversationId];
    if (conv && conv.userId === userId) {
      // Clear old messages and save new ones to maintain exact state
      for (const mId in data.messages) {
        if (data.messages[mId].conversationId === conversationId) delete data.messages[mId];
      }
      for (const message of messages) {
        const id = message.id;
        data.messages[id] = { ...message, conversationId, createdAt: Date.now() };
      }
      data.conversations[conversationId].updatedAt = Date.now();
      writeDB(data);
      return true;
    }
    return false;
  },
  getUserSettings: (userId: string) => {
    const data = readDB();
    return data.settings[userId] || { theme: 'system', defaultModel: 'gemini-3.5-flash' };
  },
  saveUserSettings: (userId: string, settings: any) => {
    const data = readDB();
    data.settings[userId] = { ...(data.settings[userId] || {}), ...settings };
    writeDB(data);
    return data.settings[userId];
  }
};
