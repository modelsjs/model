import type { Model } from './index';

export type TModelClass<M extends Model = Model, P extends OJSON = any> = M extends Model<infer PP, infer E>
    ? PP extends P
        ? {
            new(props: PP): Model<PP, E>;

            is(Class: any): boolean;
        }
        : never
    : never;

type ClassType<M extends Model = Model, P extends OJSON = any> = {
    new (props: P): M;
}

export type TModelInstace<C extends ClassType, P extends OJSON = OJSON> = C extends ClassType<infer I, infer PP>
    ? PP extends P ? I : never : never;

export type TModelProps<M extends Model | TModelClass> = M extends Model<infer P, any>
    ? P
    : M extends TModelClass<infer MM, infer PP>
        ? PP
        : never;

type KeysMatching<T extends object, V> = {
    [K in keyof T]-?: K extends V ? K : never
}[keyof T];

export type TModelResult<M extends Model | TModelClass> = M extends Model
    ? Pick<M, KeysMatching<M, string>>
    : M extends TModelClass<infer MM, infer PP>
        ? Pick<TModelInstace<TModelClass<MM, PP>>, KeysMatching<TModelInstace<TModelClass<MM, PP>>, string>>
        : never;

export type TModelError<M extends Model | TModelClass> = M extends Model<any, infer E>
    ? E
    : M extends TModelClass<infer MM>
        ? MM extends Model<any, infer E>
            ? E
            : never
        : never;

export type TSubscription = (next: any, prev: any) => void;

export type TSubscriptionLike = (next: any, prev: any) => any;
