function getDate() {
    return new Date().toISOString();
}

class StreamLogger {
    constructor(stream) {
        this.stream = stream;
    }

    log(type, content) {
        this.stream.write(`[${type}] ${getDate()}: ${content}\n`);
    }
}

module.exports = function(stream) { return new StreamLogger(stream); };