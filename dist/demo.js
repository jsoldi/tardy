import { Tardy } from './index.js';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const process = (min, max) => delay(Math.random() * (max - min) + min);
const increments = (count) => Array.from({ length: count }, (_, i) => i);
const countdown = (seconds) => new Tardy(async (client) => {
    for (let i = seconds; i >= 0; i--) {
        client.log(`${i}s`);
        client.update(1 - i / seconds);
        await delay(1000);
    }
});
const sample = new Tardy(async (client) => {
    await countdown(5).report('Countdown').run(client);
    await Tardy.seq(increments(10).map(n => new Tardy(() => process(100, 500)).report(`Doing ${n}`))).report('Sequence', 0, .5).run(client);
    await Tardy.all(increments(100).map(n => new Tardy(() => process(1000, 5000)).report())).report('Parallel', 0.5, 1).run(client);
    client.log('Done');
});
sample.exec().then(() => sample.exec({ multiline: false }));
