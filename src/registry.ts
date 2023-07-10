import type { TModelClass, Model } from './index';
import { TModelProps } from './types';
import { sign } from './utils';

class Registry {
    private store: Map<TModelClass, Record<string, Model>> = new Map();

    get<M extends Model>(Model: TModelClass<M>, props: TModelProps<M>): M | null {
        const key = sign(props);

        const store: Record<string, Model> = this.store.get(Model) || {};

        return (store[key] as M) || null;
    }

    set<M extends Model>(Model: TModelClass<M>, props: TModelProps<M>, instance: M) {
        const key = sign(props);
        const store: Record<string, Model> = Object.assign(this.store.get(Model) || {}, {
            [key]: instance
        });

        this.store.set(Model, store);
    }
}

export const registry = new Registry();