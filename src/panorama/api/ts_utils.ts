export class TSUtils {
    public static ToArray<T>(obj: object): T[] {
        if (obj == undefined) {
            return [];
        }

        const result: T[] = [];
        let key = 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        while ((obj as any)[key] != undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result.push((obj as any)[key]);
            key++;
        }
        return result;
    }

    public static KeysOf<T extends number>(obj: object): T[] {
        if (obj == undefined) {
            return [];
        }
        return Object.keys(obj) as unknown as T[];
    }
}
