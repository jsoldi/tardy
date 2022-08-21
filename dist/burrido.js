// A simple immutable generator emulator that replays history in order to
// "clone" JavaScript's mutable generators
const next = (regen, ...args) => (data) => {
    const gen = regen(...args);
    return gen.next(data), gen;
};
const immutagen = (regen) => (...args) => function loop(regen) {
    return function (gen, data) {
        const { value, done } = gen.next(data);
        if (done)
            return { value, next: null, mutable: gen };
        let replay = false;
        const recur = loop(next(regen, data));
        const mutable = () => replay ? regen(data) : replay = gen;
        const result = { value, next: (value) => recur(mutable(), value) };
        return Object.defineProperty(result, "mutable", { get: mutable });
    };
}(next(regen, ...args))(regen(...args));
export default function ({ pure, bind }) {
    const doNext = (next) => function (input) {
        const { value, next: nextNext } = next(input);
        if (!nextNext)
            return pure(value);
        return bind(value, doNext(nextNext));
    };
    return {
        Do(genFactory) {
            return doNext(immutagen(genFactory))();
        }
    };
}
