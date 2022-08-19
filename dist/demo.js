import { Tardy } from './index.js';
async function test() {
    const tardy = Tardy.client.bind(async (_) => {
        const a = Tardy
            .seq(new Array(10).fill(0)
            .map(Tardy.lift(async (_, i) => {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
            return `A: ${i}`;
        }))
            .map((t, i) => t.report(`Item ${i + 1}/10`)))
            .report('Doing A');
        const b = Tardy
            .all(new Array(20).fill(0)
            .map(Tardy.lift(async (_, i) => {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 5000));
            return `B: ${i}`;
        }))
            .map(t => t.report()))
            .report('Doing B');
        return a.bind(async (a) => b.map(b => [...a, ...b]));
    });
    const result = await tardy.exec({
        separator: ' / ',
        multiline: true
    });
    console.log(result);
}
test();
