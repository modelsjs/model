import type { Model, TModelClass, TModelProps, TModelResult, TModelInstace } from './index';
import { isPlainObject } from 'lodash';
import { ok } from 'assert';
import { stringify, parse } from 'qs';
import { result } from './symbols';
import { ControlFields } from './controlplane';
import { registry } from './registry';
import { InstanceGuard } from './guards';
import { on, set } from './accessors';

const pick = (data: OJSON, props: string[]): OJSON => {
    return props.reduce(
        (acc, prop) => Object.assign(acc, { [prop]: data[prop] }),
        {} as OJSON
    );
}

export function construct<C extends TModelClass, P extends TModelProps<C>>(
    Model: C,
    props: P = {} as P
): TModelInstace<C, P> {
    props = props || {} as P;
    let instance = registry.get(Model, props);

    if (!instance) {
        instance = InstanceGuard(Model, props, () => new Model(props));

        proxy(instance);

        registry.set(Model, props, instance);
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

sign.parse = function(sign: string) {
    return parse(sign, {
        allowDots: true,
        strictNullHandling: true,
    })
}

export function map<C extends TModelClass, P extends TModelProps<C>, K extends keyof P>(
    props: K | K[],
    Class: C
): PropertyDecorator {
    props = ([] as K[]).concat(props);

    ok(props.length, 'Unable remap collection by empty props list');

    function decorator(descriptor: any) {
        const { key } = descriptor;

        descriptor.initializer = function(this: Model) {
            const target = this;

            ok(typeof key === 'string', `Unable to decorate non string property ${ String(key) }`);

            on(target, ControlFields.Result, (result: Nullable<OJSON>) => {
                if (!result) {
                    return;
                }

                const list = result[key] as TModelResult<C>[];

                ok(Array.isArray(list), `Unable to remap non array property ${ key }`);

                list.forEach((item) => {
                    if (Class.is(item)) {
                        return;
                    }

                    ok(isPlainObject(item), `Unable to remap not plain object ${ key }`);

                    set<Model>(construct(Class, pick(item, props as string[]) as P), item);
                });
            });
        }
    }

    return decorator;
}