import { runTask } from "expo-server";

/** Keep the request alive while awaiting long work (CodeBox runs). */
export function runTaskAsync<T>(fn: () => Promise<T>) {
    return new Promise<T>((resolve, reject) => {
        runTask(async () => {
            try {
                resolve(await fn());
            } catch (error) {
                reject(error);
            }
        });
    });
}
