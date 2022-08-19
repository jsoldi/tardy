export interface ITardyClient {
    update(progress: number): void;
    log(msg: string): void;
    dispose?(): void;
}
export declare class TardyClient {
    private readonly base;
    static separator: string;
    static done: string;
    static readonly silent: TardyClient;
    static readonly plain: TardyClient;
    protected constructor(base: ITardyClient);
    update(progress: number): void;
    log(msg: string): void;
    dispose(): void;
    copy(mods?: Partial<ITardyClient>): TardyClient;
    transform(mult?: number, add?: number): TardyClient;
    project(min?: number, max?: number): TardyClient;
    entitle(name?: string | null): TardyClient;
    distribute<N extends number[]>(...ratios: N): {
        [i in keyof N]: TardyClient;
    };
    split(count: number): TardyClient[];
    static create(client: ITardyClient | 'cli' | 'silent' | 'plain'): TardyClient;
}
interface CliTardyClientOptions {
    multiline: boolean;
    format: string;
}
export declare class CliTardyClient extends TardyClient {
    private readonly defaultOptions;
    private readonly options;
    private readonly bar;
    private restart;
    constructor(options?: Partial<CliTardyClientOptions>);
    private static createBar;
}
export {};
