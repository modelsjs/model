import { ModelError } from './error';
import { ModelClassSign, ControlPlane, Props, state, error, result, revision } from './symbols';
import { ModelControl } from './controlplane';
import { InstanceGuard } from './guards';

export enum ModelState {
    Initial = 'initial',
    Ready = 'ready',
    Error = 'error'
}

export class Model<P extends OJSON = OJSON, E extends ModelError = ModelError> {
    static [ModelClassSign] = true;

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
        return this[ControlPlane].state;
    }

    get [result](): Nullable<this> {
        return this[ControlPlane].result as Nullable<this>;
    }

    get [error](): Nullable<E> {
        return this[ControlPlane].error as Nullable<E>;
    }

    get [revision](): number {
        return this[ControlPlane].revision;
    }
}