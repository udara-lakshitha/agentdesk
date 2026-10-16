import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

type Message = { id: number, from: string, body: string, createdAt: string };
const messages: Message[] = []; // temp storge and will add actual database later

app.get("/api/messages", (_req, res) => {
    res.json(messages);
});

app.post("/api/messages", (req, res) => {
    const { from, body } = req.body;
    if (!from || !body) {
        return res.status(400).json({ error: "from and body are required" });
    }

    const message: Message = {
        id: messages.length + 1,
        from,
        body,
        createdAt: new Date().toISOString(),
    };
    messages.push(message);
    res.status(201).json(message);
});

app.listen(4000, () => console.log("Server running on http://localhost:4000"));