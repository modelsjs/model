import type { TModelError, TModelFields, TModelResult, TSubscription, TSubscriptionLike } from './types';
import type { Model } from './model';
import type { ModelError } from './error';
import { state, error, result, Props, ControlPlane } from './symbols';
import { sign } from './utils';

export function getProps<M extends Model>(model: M) {
    return model[Props];
}

export function getSign<M extends Model>(model: M) {
    return sign(model[Props]);
}

export function getState<M extends Model>(model: M) {
    return model[state];
}

export function getError<M extends Model>(model: M) {
    return model[error];
}

export function getResult<M extends Model>(model: M) {
    return model[result];
}

export function on<T = unknown>(
    model: Model,
    field: TModelFields,
    handler: TSubscriptionLike
) {
    const ref: TSubscription = (next, prev) => {
        handler(next, prev);
    };

    return model[ControlPlane].subscribe(field, ref);
}

export function once<M extends Model = Model, F extends TModelFields = TModelFields>(
    model: M,
    field: F,
    handler: TSubscriptionLike
) {
    const ref: TSubscription = (next, prev) => {
        dispose();
        handler(next, prev);
    };

    const dispose = model[ControlPlane].subscribe(field, ref);

    return dispose;
}

export function set<M extends Model>(model: M, data: Nullable<TModelResult<M> | TModelError<M>>) {
    model[ControlPlane].set(data as Nullable<OJSON | ModelError>);
}