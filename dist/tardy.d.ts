import { IBarTardyClientOptions, ITardyClientOptions, TardyClient } from "./internal.js";
declare type Awaitable<T> = T | Promise<T>;
export declare class Tardy<out T> {
    readonly run: (client: TardyClient) => Promise<T>;
    constructor(run: (client: TardyClient) => Promise<T>);
    static of<T>(value: T): Tardy<T>;
    /**
     * This corresponds to calling an async function to create a promise.
     */
    static lift<A extends any[], T>(f: (this: TardyClient, ...args: A) => Promise<T>): (...args: A) => Tardy<T>;
    static get client(): Tardy<TardyClient>;
    static all<T>(progresses: Tardy<T>[]): Tardy<T[]>;
    static seq<T>(progresses: Tardy<T>[]): Tardy<T[]>;
    bind<U>(f: (value: T) => Awaitable<Tardy<U>>): Tardy<U>;
    log(msg: string): Tardy<T>;
    map<U>(f: (value: T) => U): Tardy<U>;
    report(title?: string | null, min?: number, max?: number): Tardy<T>;
    static reportCountdown(seconds: number, name?: string): Tardy<void>;
    exec(options?: Partial<ITardyClientOptions & IBarTardyClientOptions>): Promise<T>;
}
export {};
