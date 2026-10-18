import * as repo from "../repositories/messageRepository";

export function getMessages() {
    return repo.listMessages();
}

export function createMessage(from: string, body: string) {
    return repo.insertMessage(from.trim(), body.trim());
}