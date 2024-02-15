/* eslint-disable @typescript-eslint/no-explicit-any */

const global = globalThis as typeof globalThis & { reloadCache: Record<string, any> };
if (global.reloadCache === undefined) {
    global.reloadCache = {};
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function reloadable<T extends { new (...args: any[]): {} }>(constructor: T): T {
    const className = constructor.name;
    if (global.reloadCache[className] === undefined) {
        global.reloadCache[className] = constructor;
    }

    Object.assign(global.reloadCache[className].prototype, constructor.prototype);
    return global.reloadCache[className];
}
