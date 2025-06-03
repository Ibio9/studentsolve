import React, { useState } from 'react';

export default function ChatTutor() {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newChat = [...chat, { role: 'user', content: input }];
    setChat(newChat);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }) // ✅ FIXED HERE
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setChat([...newChat, { role: 'assistant', content: data.result }]); // ✅ .result not .answer
    } catch (err) {
      setChat([...newChat, { role: 'assistant', content: 'Error: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 text-white">
      <h2 className="text-2xl font-bold mb-4">🤖 AI Tutor</h2>
      <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto border p-3 rounded-lg bg-gray-800">
        {chat.map((msg, i) => (
          <div key={i} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <p className={`inline-block px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
              <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
            </p>
          </div>
        ))}
        {loading && <p className="italic text-gray-400">Thinking...</p>}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
