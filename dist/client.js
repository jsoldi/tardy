import cliProgress from 'cli-progress';
export class TardyClient {
    constructor(base) {
        this.base = base;
    }
    update(progress) {
        this.base.update(progress);
    }
    log(msg) {
        this.base.log(msg);
    }
    dispose() {
        this.base.dispose && this.base.dispose();
    }
    copy(mods) {
        return TardyClient.create({ ...this.base, ...mods });
    }
    transform(mult = 1, add = 0) {
        return this.copy({ update: progress => this.base.update(progress * mult + add) });
    }
    project(min = 0, max = 1) {
        return this.transform(max - min, min);
    }
    entitle(name) {
        return this.copy({ log: msg => this.base.log(`${name ?? ''}${name && msg ? TardyClient.separator : ''}${msg ?? ''}`) });
    }
    distribute(...ratios) {
        const totalRatio = ratios.reduce((a, b) => a + b, 0);
        const items = ratios.map(ratio => ({ progress: 0, ratio }));
        return items.map(item => {
            return this.copy({
                update: progress => {
                    item.progress = progress;
                    let done = true; // To avoid weird float rounding issues
                    const value = items.map(item => {
                        done && (done = item.progress === 1);
                        return item.progress * item.ratio;
                    }).reduce((a, b) => a + b, 0) / totalRatio;
                    this.base.update(done ? 1 : value);
                }
            });
        });
    }
    split(count) {
        return this.distribute(...new Array(count).fill(1));
    }
    static create(client) {
        if (typeof client === 'object')
            return client instanceof TardyClient ? client : new TardyClient(client);
        switch (client) {
            case 'cli': return new CliTardyClient();
            case 'silent': return TardyClient.silent;
            case 'plain': return TardyClient.plain;
        }
    }
}
TardyClient.separator = ' > ';
TardyClient.done = 'Done.';
TardyClient.silent = TardyClient.create({ update: () => { }, log: () => { } });
TardyClient.plain = TardyClient.create({ update: progress => console.log(`${Math.round(progress * 100)}%`), log: msg => console.log(msg) });
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
export class CliTardyClient extends TardyClient {
    constructor(options) {
        super({
            update: progress => {
                if (this.restart && progress === 0) {
                    this.restart = false;
                    this.bar.stop();
                    this.bar.start(1, 0, { log: '' });
                }
                else if (this.options.multiline && progress === 1)
                    this.restart = true;
                this.bar.update(progress);
            },
            log: msg => {
                this.bar.update({ log: msg });
            },
            dispose: () => {
                this.bar.stop();
            }
        });
        this.defaultOptions = {
            multiline: true,
            format: '{bar} {percentage}% | ETA: {eta}s | {log}'
        };
        this.restart = true;
        this.options = { ...this.defaultOptions, ...options };
        this.bar = CliTardyClient.createBar(this.options.format);
    }
    static createBar(format) {
        return new cliProgress.SingleBar({ format }, cliProgress.Presets.shades_classic);
    }
}
