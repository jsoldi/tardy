import { IBarTardyClientOptions, ITardyClientOptions, TardyClient } from "./internal.js";

type Awaitable<T> = T | Promise<T>;

export class Tardy<out T> {
    constructor(public readonly run: (client: TardyClient) => Promise<T>) { }

    static of<T>(value: T): Tardy<T> {
        return new Tardy(async () => value);
    }

    /**
     * This corresponds to calling an async function to create a promise.
     */
    static lift<A extends any[], T>(f: (this: TardyClient, ...args: A) => Promise<T>): (...args: A) => Tardy<T> {
        return (...args) => new Tardy(async client => await f.call(client, ...args));
    }

    static get client(): Tardy<TardyClient> {
        return new Tardy(async client => client);
    }

    static all<T>(progresses: Tardy<T>[]): Tardy<T[]> {
        return new Tardy(async client => {
            const slices = client.split(progresses.length);
            return await Promise.all(progresses.map((progress, i) => progress.run(slices[i])));
        });
    }

    static seq<T>(progresses: Tardy<T>[]): Tardy<T[]> {
        return new Tardy(async client => {
            const slice = client.split(progresses.length);
            const results = [];

            for (let i = 0; i < progresses.length; i++) 
                results.push(await progresses[i].run(slice[i]));
                
            return results;
        })
    }

    bind<U>(f: (value: T) => Awaitable<Tardy<U>>): Tardy<U> {
        return new Tardy(async client => {
            const value = await this.run(client);
            const next = await f(value);
            return await next.run(client);
        });
    }

    log(msg: string): Tardy<T> {
        return new Tardy<T>(async client => {
            const result = await this.run(client);
            client.log(msg);
            return result;
        });
    }

    map<U>(f: (value: T) => U): Tardy<U> {
        return this.bind(value => Tardy.of(f(value)));
    }

    report(title?: string | null, min: number = 0, max: number = 1): Tardy<T> {
        return new Tardy(async client => {
            const sub = client.entitle(title).project(min, max);
            sub.update(0);
            title && sub.log('');
    
            try {
                return await this.run(sub);
            }
            finally {
                sub.update(1);
            }
        });
    }

    static reportCountdown(seconds: number, name: string = 'Countdown'): Tardy<void> {
        return new Tardy(async client => {
            for (let i = seconds; i > 0; i--) {
                client.update(1 - i / seconds);
                client.log(i.toString());
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            client.log('0');
        })
        .report(name);
    }

    async exec(options?: Partial<ITardyClientOptions & IBarTardyClientOptions>) {
        const client = TardyClient.clients.bar(options);

        try {
            return await this.run(client);
        }
        finally {
            client.dispose();
        }
    }
}
