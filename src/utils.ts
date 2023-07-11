import type { Model, TModelClass, TModelProps, TModelResult, TModelInstace } from './index';
import { stringify } from 'qs';
import { ModelClassSign, result } from './symbols';
import { registry } from './registry';
import { InstanceGuard } from './guards';
import { on, set } from './accessors';

const pick = <M extends Model>(data: OJSON, props: string[]): TModelProps<M> => {
    return props.reduce(
        (acc, prop) => Object.assign(acc, {[prop]: data[prop]}),
        {} as TModelProps<M>
    );
}

export function isModelClass<M extends Model = Model>(target: any): target is TModelClass<M> {
    return target && (ModelClassSign in target);
}

export function construct<M extends Model>(Model: TModelClass<M>, props: TModelProps<M>, result?: TModelResult<M>): M {
    let instance: M | null = registry.get(Model, props);

    if (!instance) {
        instance = InstanceGuard<M>(Model, props, () => new Model(props) as M);

        proxy(instance);

        registry.set(Model, props, instance);
    }

    if (result) {
        set(instance, result);
    }

    return instance;
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
    P extends TModelProps<TModelInstace<C>>,
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

            on(target, 'result', (result) => {
                if (!result) {
                    return;
                }

                const list = result[key as keyof typeof result] as OJSON[];
                if (!Array.isArray(list)) {
                    throw new TypeError(`Unable to remap non array property ${key}`);
                }

                list.forEach((item) => {
                    construct(Model, pick(item, props as string[]), item);
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