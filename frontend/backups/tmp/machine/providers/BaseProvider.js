export class BaseProvider {
    constructor(onData) {
        if (new.target === BaseProvider) {
            throw new Error("Cannot instantiate abstract class BaseProvider directly.");
        }
        this.onData = onData || (() => {}); // Ensure it's a function
    }

    async connect() {
        throw new Error("connect() must be implemented by subclass");
    }

    async disconnect() {
        throw new Error("disconnect() must be implemented by subclass");
    }

    async send(command) {
        throw new Error("send() must be implemented by subclass");
    }

    async sendRaw(command) {
        throw new Error("send() must be implemented by subclass");
    }
}
