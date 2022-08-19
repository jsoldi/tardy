import { ITardyClient } from "./internal.js";
export interface IBarTardyClientOptions {
    multiline: boolean;
    format: string;
}
export declare class BarTardyClient implements ITardyClient {
    protected readonly options: IBarTardyClientOptions;
    protected static readonly defaultOptions: IBarTardyClientOptions;
    private readonly bar;
    private restart;
    protected constructor(options: IBarTardyClientOptions);
    private static createBar;
    update(progress: number): void;
    log(msg: string): void;
    dispose(): void;
    static create(options?: Partial<IBarTardyClientOptions>): BarTardyClient;
}
