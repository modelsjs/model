import type { Model, TModelClass } from './index';
import type { TModelProps } from './types';

const InstanceGuardWait: {
    Model: TModelClass,
    props: OJSON
}[] = [];

export function InstanceGuard<M extends Model>(Model: TModelClass<M>, props: TModelProps<M>, call: Action<M>): M
export function InstanceGuard<M extends Model>(Model: TModelClass<M>, props: TModelProps<M>): boolean
export function InstanceGuard<M extends Model>(Model: TModelClass<M>, props: TModelProps<M>, call?: any) {
    if (call) {
        InstanceGuardWait.push({Model, props});

        return call();
    } else {
        const last = InstanceGuardWait[InstanceGuardWait.length - 1];

        if (last.Model === Model && last.props === props) {
            InstanceGuardWait.pop();

            return true;
        }

        return false;
    }
}