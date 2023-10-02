import { ModelError } from './error';
import { ModelClassSign, ControlPlane, Props, state, error, result, revision } from './symbols';
import { ModelControl, ControlFields } from './controlplane';
import { InstanceGuard } from './guards';
import { TModelClass } from './types';

export enum ModelState {
    Initial = 'initial',
    Ready = 'ready',
    Error = 'error'
}

export class Model<P extends OJSON = OJSON, E extends ModelError = ModelError> {
    static [ModelClassSign] = true;

    static isModel(instance: any): instance is Model {
        return instance instanceof Model;
    }

    static is(instance: any): instance is typeof this {
        return instance instanceof this;
    }

    readonly [ControlPlane]!: ModelControl;

    readonly [Props]!: Readonly<P>;

    constructor(props: P) {
        if (!InstanceGuard(new.target, props)) {
            throw new Error('Unexpected direct access to Model constructor');
        }

        Object.defineProperty(this, Props, {
            enumerable: false,
            get() { return props }
        });

        Object.defineProperty(this, ControlPlane, {
            enumerable: false,
            value: new ModelControl()
        });
    }

    get [state](): ModelState {
        return this[ControlPlane][ControlFields.State];
    }

    get [result](): Nullable<this> {
        return this[ControlPlane][ControlFields.Result] as Nullable<this>;
    }

    get [error](): Nullable<E> {
        return this[ControlPlane][ControlFields.Error] as Nullable<E>;
    }

    get [revision](): number {
        return this[ControlPlane][ControlFields.Revision];
    }
}

export function isModelClass<M extends Model = Model>(target: any): target is TModelClass<M> {
    return target && (ModelClassSign in target);
}