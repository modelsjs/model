import type { Model, TModelClass, TModelProps, TModelResult, TModelInstace, TSubscription } from './index';
import { stringify } from 'qs';
import { ModelClassSign, result } from './symbols';
import { registry } from './registry';
import { InstanceGuard } from './guards';
import { on, set } from './accessors';

const pick = (data: OJSON, props: string[]): OJSON => {
    return props.reduce(
        (acc, prop) => Object.assign(acc, {[prop]: data[prop]}),
        {} as OJSON
    );
}

export function isModelClass<M extends Model = Model>(target: any): target is TModelClass<M> {
    return target && (ModelClassSign in target);
}

export function construct<C extends TModelClass, P extends TModelProps<C>>(
    Model: C,
    props: P = {} as P,
    result?: TModelResult<C>
): TModelInstace<C, P> {
    props = props || {} as P;
    let instance = registry.get(Model, props);

    if (!instance) {
        instance = InstanceGuard(Model, props, () => new Model(props));

        proxy(instance);

        registry.set(Model, props, instance);
    }

    if (result) {
        set(instance, result);
    }

    return instance as TModelInstace<C, P>;
}

function proxy(model: Model) {
    Object.keys(model).forEach(key => {
        const descriptor = Object.getOwnPropertyDescriptor(model, key);

        if (descriptor && 'value' in descriptor && descriptor.value === undefined) {
            Object.defineProperty(model, key, {
                enumerable: true,
                configurable: true,
                get() {
                    return this[result] && this[result][key];
                }
            });
        }
    });
}

export function sign(params: OJSON) {
    return stringify(params, {
        allowDots: true,
        arrayFormat: 'repeat',
        strictNullHandling: true,
        sort: (a: string, b: string) => a.localeCompare(b)
    });
}

export function map<
    C extends TModelClass,
    P extends TModelProps<C>,
    K extends keyof P
    >(props: K | K[], Model: C): PropertyDecorator {
    props = ([] as K[]).concat(props);

    function decorator(descriptor: any) {
        const { key } = descriptor;

        descriptor.initializer = function(this: Model) {
            const target = this;

            if (typeof key !== 'string') {
                throw new TypeError(`Unable to decorate non string property ${String(key)}`);
            }

            on(target, 'result', (result: Nullable<TModelResult<C>>) => {
                if (!result) {
                    return;
                }

                const list = result[key as keyof typeof result] as OJSON[];
                if (!Array.isArray(list)) {
                    throw new TypeError(`Unable to remap non array property ${key}`);
                }

                list.forEach((item) => {
                    construct(Model, pick(item, props as string[]) as P, item as TModelResult<C>);
                });
            });
        }


        // target.elements.push({
        //     kind: 'field',
        //     placement: 'static',
        //     key: key,
        //     descriptor: {},
        //     initializer: function() {
        //         return (this[ResolveStrategy] || []).concat(strategy);
        //     }
        // });
    }

    return decorator;
}

type OnchangeCallback<T> = (changes: [T, any, any][]) => void

export const transaction = <T extends string>(fields: readonly T[]) =>
    function transaction(this: Record<T, any>, tx: () => void, onchange: OnchangeCallback<T>) {
        const state = fields.reduce((acc, key) => {
            acc[key] = this[key];

            return acc;
        }, {} as Record<T, any>);

        tx();

        const changed = fields.filter((field) => this[field] !== state[field]);

        if (changed.length) {
            onchange(changed.map((field) => [ field, state[field], this[field] ]));
        }
    };

const call = (...args: any[]) => (fn: (...args: any[]) => void) => fn(...args);

export const events = <T extends string>(fields: readonly T[]) => {
    const subscriptions = fields.reduce((acc, field) => {
        acc[field] = new Set<TSubscription>();

        return acc;
    }, {} as Record<T, Set<TSubscription>>);

    return {
        subscribe(field: T, handler: TSubscription) {
            subscriptions[field].add(handler);

            return () => {
                subscriptions[field].delete(handler);
            };
        },

        notify(field: T, prev: any, next: any) {
            if (subscriptions[field].size) {
                [...subscriptions[field]].forEach(call(next, prev));
            }
        }
    }
};
