import { BarTardyClient } from "./internal.js";
export class TardyClient {
    constructor(base, options) {
        this.base = base;
        this.options = options;
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
        return new TardyClient({
            update: mods?.update?.bind(mods) ?? this.base.update.bind(this.base),
            log: mods?.log?.bind(mods) ?? this.base.log.bind(this.base)
        }, this.options);
    }
    transform(mult = 1, add = 0) {
        return this.copy({ update: progress => this.base.update(progress * mult + add) });
    }
    project(min = 0, max = 1) {
        return this.transform(max - min, min);
    }
    entitle(name) {
        return this.copy({ log: msg => this.base.log(`${name ?? ''}${name && msg ? this.options.separator : ''}${msg ?? ''}`) });
    }
    distribute(...ratios) {
        const totalRatio = ratios.reduce((a, b) => a + b, 0);
        const items = ratios.map(ratio => ({ progress: 0, ratio }));
        return items.map(item => {
            return this.copy({
                update: progress => {
                    item.progress = progress;
                    let done = true;
                    let total = 0;
                    for (let { progress, ratio } of items) {
                        total += progress * ratio;
                        done && (done = progress === 1);
                    }
                    this.base.update(done ? 1 : total / totalRatio);
                }
            });
        });
    }
    split(count) {
        return this.distribute(...new Array(count).fill(1));
    }
    static create(base, options) {
        return new TardyClient(base, { ...TardyClient.defaultOptions, ...options });
    }
}
TardyClient.defaultOptions = {
    separator: ' > '
};
TardyClient.clients = new class {
    constructor() {
        this.mute = TardyClient.create({ update: () => { }, log: () => { } });
        this.log = TardyClient.create({ update: progress => console.log(`${Math.round(progress * 100)}%`), log: msg => console.log(msg) });
    }
    bar(options) { return TardyClient.create(BarTardyClient.create(options), options); }
};
