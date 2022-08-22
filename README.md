# tardy

Turn promises into progress reporting processes in a functional/monadic style.

Requires ES modules.

## Quickstart

```typescript
import { Tardy } from 'tardy'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const process = (min: number, max: number) => delay(Math.random() * (max - min) + min);
const increments = (count: number) => Array.from({ length: count }, (_, i) => i);

const sample = new Tardy(async client => {
    await Tardy.reportCountdown(5).run(client);

    await Tardy.seq(increments(10).map(n => 
        new Tardy(() => process(100, 500)).report(`Doing ${n}`)
    )).report('Sequence', 0, .5).run(client);

    await Tardy.all(increments(100).map(n => 
        new Tardy(() => process(1000, 5000)).report()
    )).report('Parallel', 0.5, 1).run(client);

    client.log('Done'); 
});

sample.exec().then(() => 
    sample.exec({ multiline: false })
);
```
