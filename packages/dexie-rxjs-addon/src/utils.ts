
export function mixinClass(target: any, source: any): void {

    function mixin(target: any, object: any): any {
        const prototype = Object.getPrototypeOf(object);
        Object.getOwnPropertyNames(prototype).forEach(name => {
            if (target[name] !== undefined) { return; }
            Object.defineProperty(
                Object.getPrototypeOf(target),
                name,
                Object.getOwnPropertyDescriptor(prototype, name)!
            );
        });
        const prototypeChain = Object.getPrototypeOf(prototype);
        if (prototypeChain) return mixin(target, prototype);
    }

    Object.keys(source).forEach(key => {
        if (key === 'constructor' || target[key] !== undefined) { return; }
        target[key] = source[key];
    });

    mixin(target, source);
}
