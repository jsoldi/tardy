import cliProgress from 'cli-progress';
import { ITardyClient } from "./internal.js";

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

export interface IBarTardyClientOptions {
    multiline: boolean,
    format: string
}

export class BarTardyClient implements ITardyClient {
    protected static readonly defaultOptions: IBarTardyClientOptions = { 
        multiline: true,
        format: '{bar} {percentage}% | {log} '
    }

    private readonly bar: IBar;
    private restart = true;

    protected constructor(protected readonly options: IBarTardyClientOptions) {
        this.bar = BarTardyClient.createBar(this.options.format);
    }

    private static createBar(format: string) {
        return new cliProgress.SingleBar({ format, hideCursor: true }, cliProgress.Presets.shades_classic);   
    }

    update(progress: number) {
        if (this.restart && progress === 0) {
            this.restart = false;
            this.bar.stop();
            this.bar.start(1, 0, { log: '' });
        }
        else if (this.options.multiline && progress === 1) 
            this.restart = true;

        this.bar.update(progress);
    }

    log(msg: string) {
        this.bar.update({ log: msg });
    }

    dispose() {
        this.bar.stop();
    }

    static create(options?: Partial<IBarTardyClientOptions>) {
        return new BarTardyClient({ ...BarTardyClient.defaultOptions, ...options });
    }
}
