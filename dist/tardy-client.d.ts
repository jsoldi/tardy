import { IBarTardyClientOptions } from "./internal.js";
export interface ITardyClient {
    update(progress: number): void;
    log(msg: string): void;
    dispose?(): void;
}
export interface ITardyClientOptions {
    separator: string;
}
export declare class TardyClient implements ITardyClient {
    private readonly base;
    protected readonly options: ITardyClientOptions;
    protected static readonly defaultOptions: ITardyClientOptions;
    protected constructor(base: ITardyClient, options: ITardyClientOptions);
    static readonly clients: {
        readonly mute: TardyClient;
        readonly log: TardyClient;
        bar(options?: Partial<ITardyClientOptions & IBarTardyClientOptions>): TardyClient;
    };
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
    static create(base: ITardyClient, options?: Partial<ITardyClientOptions>): TardyClient;
}
