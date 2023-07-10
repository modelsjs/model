import type { Model, ModelState } from './index';
import type { ModelError } from './error';
import type { ModelClassSign } from './symbols';

export type TModelClass<M extends Model = Model, P extends OJSON = any> = M extends Model<infer PP, infer E>
    ? PP extends P
        ? {
            new(props: P): Model<P, E>

            [ModelClassSign]: boolean;
        }
        : never
    : never;

type ClassType<M extends Model = Model, P extends OJSON = any> = {
    new (props: P): M;
}

export type TModelInstace<C extends ClassType, P extends OJSON = OJSON> = C extends ClassType<infer I, infer PP>
    ? PP extends P ? I : never : never;

export type TModelProps<M extends Model> = M extends Model<infer P, any> ? P : never;

type KeysMatching<T extends object, V> = {
    [K in keyof T]-?: K extends V ? K : never
}[keyof T];

export type TModelResult<M extends Model> = M extends Model ? Pick<M, KeysMatching<M, string>> : never;

export type TModelError<M extends Model> = M extends Model<any, infer E> ? E : never;

export type TModelFields = 'state' | 'error' | 'result' | 'revision';

export type TSubscriptionHandler<T> = (next: T, prev: T) => void;

export type TSubscriptionData<M extends Model = Model, T extends TModelFields = TModelFields> =
    T extends 'state' ?
        ModelState :
        T extends 'error' ?
            Nullable<ModelError> :
            T extends 'result' ?
                Nullable<TModelResult<M>> :
                T extends 'revision' ?
                    number :
                    T extends TModelFields ?
                        Nullable<TModelResult<M>> | Nullable<ModelError> | ModelState :
                        never;

export type TSubscription<M extends Model = Model, T extends TModelFields = TModelFields> =
    TSubscriptionHandler<TSubscriptionData<M, T>>;
