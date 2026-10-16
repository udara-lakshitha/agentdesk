import { useState, useEffect } from "react";

type Message = { id: number, from: string, body: string, createdAt: string }; 

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [from, setFrom] = useState("");
  const [body, setBody] = useState("");

  async function loadMessages() {
    const res = await fetch("http://localhost:4000/api/messages");
    setMessages(await res.json());
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("http://localhost:4000/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, body }),
    });
    setBody("");
    loadMessages();
  }

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h1>AgentDesk Inbox</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="From" value={from} onChange={(e) => setFrom(e.target.value)} />
        <textarea placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} />
        <button type="submit">Send</button>
      </form>
      <ul>
        {messages.map((m) => (
          <li key={m.id}><strong>{m.from}:</strong> {m.body}</li>
        ))}
      </ul>
    </div>
  );
}