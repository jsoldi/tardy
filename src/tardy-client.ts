import { BarTardyClient, IBarTardyClientOptions } from "./internal.js";

export interface ITardyClient {
    update(progress: number): void
    log(msg: string): void
    dispose?(): void
}

export interface ITardyClientOptions {
    separator: string
}

export class TardyClient implements ITardyClient {
    protected static readonly defaultOptions: ITardyClientOptions = {
        separator: ' > '
    }

    protected constructor(private readonly base: ITardyClient, protected readonly options: ITardyClientOptions) { }

    public static readonly clients = new class {
        readonly mute = TardyClient.create({ update: () => { }, log: () => { } });
        readonly log = TardyClient.create({ update: progress => console.log(`${Math.round(progress * 100)}%`), log: msg => console.log(msg) });
        bar(options?: Partial<ITardyClientOptions & IBarTardyClientOptions>) { return TardyClient.create(BarTardyClient.create(options), options); }
    }

    update(progress: number) {
        this.base.update(progress);
    }

    log(msg: string) {
        this.base.log(msg);
    }

    dispose() {
        this.base.dispose && this.base.dispose();
    }

    copy(mods?: Partial<ITardyClient>) {
        return new TardyClient({
            update: mods?.update?.bind(mods) ?? this.base.update.bind(this.base),
            log: mods?.log?.bind(mods) ?? this.base.log.bind(this.base)
        }, this.options);
    }

    transform(mult: number = 1, add: number = 0): TardyClient {
        return this.copy({ update: progress => this.base.update(progress * mult + add) });
    }

    project(min: number = 0, max: number = 1): TardyClient {
        return this.transform(max - min, min);
    }

    entitle(name?: string | null): TardyClient {
        return this.copy({ log: msg => this.base.log(`${name ?? ''}${name && msg ? this.options.separator : ''}${msg ?? ''}`) });
    }

    distribute<N extends number[]>(...ratios: N): { [i in keyof N]: TardyClient } {
        const totalRatio = ratios.reduce((a, b) => a + b, 0);
        const items = ratios.map(ratio => ({ progress: 0, ratio }));

        return items.map(item => {
            return this.copy({
                update: progress => {
                    item.progress = progress;
                    let done = true; // To avoid weird float rounding issues

                    const value = items.map(item => {
                        done &&= item.progress === 1;
                        return item.progress * item.ratio;
                    }).reduce((a, b) => a + b, 0) / totalRatio;

                    this.base.update(done ? 1 : value);
                }
            });
        }) as { [i in keyof N]: TardyClient };
    }

    split(count: number): TardyClient[] {
        return this.distribute(...new Array(count).fill(1));
    }

    static create(base: ITardyClient, options?: Partial<ITardyClientOptions>) {
        return new TardyClient(base, { ...TardyClient.defaultOptions, ...options });
    }
}
