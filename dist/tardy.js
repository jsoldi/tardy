import { TardyClient } from "./internal.js";
export class Tardy {
    constructor(run) {
        this.run = run;
    }
    static of(value) {
        return new Tardy(async () => value);
    }
    static get void() {
        return new Tardy(async () => { });
    }
    /**
     * This corresponds to calling an async function to create a promise.
     */
    static lift(f) {
        return (...args) => new Tardy(async (client) => await f.call(client, ...args));
    }
    // static wrap<A extends any[], T>(f: (...args: [...A, TardyClient]) => Promise<T>): (...args: A) => Tardy<T> {
    //     return (...args) => new Tardy(async client => await f(...args, client));
    // }
    static get client() {
        return new Tardy(async (client) => client);
    }
    static all(progresses) {
        return new Tardy(async (client) => {
            const slices = client.split(progresses.length);
            return await Promise.all(progresses.map((progress, i) => progress.run(slices[i])));
        });
    }
    static seq(progresses) {
        return new Tardy(async (client) => {
            const slice = client.split(progresses.length);
            const results = [];
            for (let i = 0; i < progresses.length; i++)
                results.push(await progresses[i].run(slice[i]));
            return results;
        });
    }
    bind(f) {
        return new Tardy(async (client) => {
            const value = await this.run(client);
            const next = await f(value, client);
            return await next.run(client);
        });
    }
    log(msg) {
        return new Tardy(async (client) => {
            const result = await this.run(client);
            client.log(msg);
            return result;
        });
    }
    map(f) {
        return this.bind(value => Tardy.of(f(value)));
    }
    report(title, min = 0, max = 1) {
        return new Tardy(async (client) => {
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
    static reportCountdown(seconds, name = 'Countdown') {
        return new Tardy(async (client) => {
            for (let i = seconds; i > 0; i--) {
                client.update(1 - i / seconds);
                client.log(i.toString());
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            client.log('0');
        })
            .report(name);
    }
    async exec(options) {
        const client = TardyClient.clients.bar(options);
        try {
            return await this.run(client);
        }
        finally {
            client.dispose();
        }
    }
}
