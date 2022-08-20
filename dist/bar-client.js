import cliProgress from 'cli-progress';
class FakeBar {
    update(data) {
        if (typeof data === 'number') {
            console.log(`-- Updating progress ${data} --`);
        }
        else {
            console.log(`-- Updating payload ${JSON.stringify(data)} --`);
        }
    }
    stop() {
        console.log('-- Stopping bar --');
    }
    start(total, startValue, payload) {
        console.log(`-- Starting bar with total ${total} and start value ${startValue} --`);
    }
}
export class BarTardyClient {
    constructor(options) {
        this.options = options;
        this.restart = true;
        this.bar = BarTardyClient.createBar(this.options.format);
    }
    static createBar(format) {
        return new cliProgress.SingleBar({ format, hideCursor: true }, cliProgress.Presets.shades_classic);
    }
    update(progress) {
        if (this.restart && progress === 0) {
            this.restart = false;
            this.bar.stop();
            this.bar.start(1, 0, { log: '' });
        }
        else if (this.options.multiline && progress === 1)
            this.restart = true;
        this.bar.update(progress);
    }
    log(msg) {
        this.bar.update({ log: msg });
    }
    dispose() {
        this.bar.stop();
    }
    static create(options) {
        return new BarTardyClient({ ...BarTardyClient.defaultOptions, ...options });
    }
}
BarTardyClient.defaultOptions = {
    multiline: true,
    format: '{bar} {percentage}% | {log}'
};
