/**
 * Chat API Client — communicates with FastAPI backend
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function sendMessage(message, threadId = null) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, thread_id: threadId }),
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  return res.json(); // { response, thread_id }
}

export async function getCars() {
  const res = await fetch(`${API_BASE}/api/cars`);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json(); // { cars: [...] }
}

export async function getCarDetail(carId) {
  const res = await fetch(`${API_BASE}/api/cars/${carId}`);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json(); // { car: {...} }
}

export async function getBanks() {
  const res = await fetch(`${API_BASE}/api/banks`);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json(); // { banks: [...] }
}

export async function sendFeedback(threadId, messageId, feedbackType, reason = null) {
  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      thread_id: threadId,
      message_id: messageId,
      feedback_type: feedbackType,
      reason,
    }),
  });
  return res.json();
}
