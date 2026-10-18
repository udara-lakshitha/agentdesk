import { useState } from "react";

type Props = {
  onCreate: (from: string, body: string) => Promise<boolean>;
  busy: boolean;
};

export function NewMessageForm({ onCreate, busy }: Props) {
  const [from, setFrom] = useState("");
  const [body, setBody] = useState("");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const ok = await onCreate(from, body);
    if (ok) setBody(""); // keep the text if it failed, so nothing is lost
  }

  return (
    <form className="new-message" onSubmit={handleSubmit}>
      <h2>New message</h2>
      <input
        placeholder="Customer name"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
      />
      <textarea
        placeholder="What did the customer write?"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button className="primary" type="submit" disabled={busy}>
        Add message
      </button>
    </form>
  );
}