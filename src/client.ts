import cliProgress from 'cli-progress';

export interface ITardyClient {
    update(progress: number): void
    log(msg: string): void
    dispose?(): void
}

export class TardyClient {
    public static separator = ' > ';
    public static done = 'Done.';
    public static readonly silent = TardyClient.create({ update: () => { }, log: () => { } });
    public static readonly plain = TardyClient.create({ update: progress => console.log(`${Math.round(progress * 100)}%`), log: msg => console.log(msg) });

    protected constructor(private readonly base: ITardyClient) { }

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
        return TardyClient.create({ ...this.base, ...mods });
    }

    transform(mult: number = 1, add: number = 0): TardyClient {
        return this.copy({ update: progress => this.base.update(progress * mult + add) });
    }

    project(min: number = 0, max: number = 1): TardyClient {
        return this.transform(max - min, min);
    }

    entitle(name?: string | null): TardyClient {
        return this.copy({ log: msg => this.base.log(`${name ?? ''}${name && msg ? TardyClient.separator : ''}${msg ?? ''}`) });
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

    static create(client: ITardyClient | 'cli' | 'silent' | 'plain'): TardyClient {
        if (typeof client === 'object') 
            return client instanceof TardyClient ? client : new TardyClient(client);

        switch (client) {
            case 'cli': return new CliTardyClient();
            case 'silent': return TardyClient.silent;
            case 'plain': return TardyClient.plain;
        }
    }
}

interface CliTardyClientOptions {
    multiline: boolean,
    format: string
}

interface IBar {
    update(payload: object): void;
    update(current: number, payload?: object): void;
    stop(): void
    start(total: number, startValue: number, payload?: object): void
}

class FakeBar implements IBar {
    update(current: number): void
    update(payload: object): void
    update(data: number | object) {
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

    start(total: number, startValue: number, payload?: object) {
        console.log(`-- Starting bar with total ${total} and start value ${startValue} --`);
    }
}

export class CliTardyClient extends TardyClient {
    private readonly defaultOptions: CliTardyClientOptions = {
        multiline: true,
        format: '{bar} {percentage}% | ETA: {eta}s | {log}'
    }

    private readonly options: CliTardyClientOptions;
    private readonly bar: IBar;
    private restart = true;

    constructor(options?: Partial<CliTardyClientOptions>) {
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

        this.options = { ...this.defaultOptions, ...options };
        this.bar = CliTardyClient.createBar(this.options.format);
    }

    private static createBar(format: string) {
        return new cliProgress.SingleBar({ format }, cliProgress.Presets.shades_classic);   
    }
}
