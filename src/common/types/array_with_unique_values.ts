/* eslint-disable @typescript-eslint/no-unused-vars */

// Usage:
// const data = ["11", "test", "tes", "1", "testing"] as const
// const arrayWithUniqueValues: ArrayWithUniqueValues<typeof data> = data

type InArray<T, X> = T extends readonly [X, ...infer _Rest]
    ? true
    : T extends readonly [X]
    ? true
    : T extends readonly [infer _, ...infer Rest]
    ? InArray<Rest, X>
    : false;

export type ArrayWithUniqueValues<T> = T extends readonly [infer X, ...infer Rest]
    ? InArray<Rest, X> extends true
        ? ["Encountered value with duplicates:", X]
        : readonly [X, ...ArrayWithUniqueValues<Rest>]
    : T;
