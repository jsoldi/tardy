interface IMonadStatic<A> {
    pure: <T>(value: T) => A;
    bind: <SA extends A, S>(s: SA, f: (value: S) => A) => A;
}
export default function <A>({ pure, bind }: IMonadStatic<A>): {
    Do(genFactory: GeneratorFunction): unknown;
};
export {};
