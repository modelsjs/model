import type { Model } from './model';
import type { TModelClass, TModelProps, TModelResult } from './types';
import { stringify } from 'qs';
import { ModelClassSign, result } from './symbols';
import { registry } from './registry';
import { InstanceGuard } from './guards';
import { set } from './accessors';

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