export function flatPromise() {
  let resolve: ((value?: unknown) => void) | undefined;
  let reject: ((value?: unknown) => void) | undefined;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  if (!resolve || !reject) {
    throw new Error("What the hell...");
  }
  return { promise, resolve, reject };
}
