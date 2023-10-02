import type { TSubscription } from './types';
import { ModelState } from './model';
import { ModelError } from './error';

export enum ControlFields {
    Error = 'error',
    Result = 'result',
    State = 'state',
    Revision = 'revision',
}

export type TControlFields = `${ControlFields}`;

const fields = Object.values(ControlFields) as TControlFields[];

export class ModelControl {

    private events = events();

    private transaction = transaction();

    public get [ControlFields.State](): ModelState {
        if (this[ControlFields.Error]) {
            return ModelState.Error;
        } else if (this[ControlFields.Result]) {
            return ModelState.Ready;
        } else {
            return ModelState.Initial;
        }
    }

    public [ControlFields.Error]: Nullable<ModelError> = null;

    public [ControlFields.Result]: Nullable<OJSON> = null;

    public [ControlFields.Revision]: number = 1;

    public set(data: Nullable<OJSON | ModelError>) {
        this.transaction(() => {
            if (data instanceof ModelError) {
                this[ControlFields.Error] = data || null;
                this[ControlFields.Result] = null;
            } else {
                this[ControlFields.Error] = null;
                this[ControlFields.Result] = data || null;
            }
        }, (changes) => {
            changes.forEach(([ field, prev, curr ]) => {
                this.events.notify(field, prev, curr);
            });

            this.events.notify(ControlFields.Revision, this[ControlFields.Revision], ++this[ControlFields.Revision]);
        });
    }

    public subscribe(field: TControlFields, handler: TSubscription) {
        return this.events.subscribe(field, handler);
    }
}

type OnchangeCallback = (changes: [ TControlFields, any, any ][]) => void;

const call = (...args: any[]) => (fn: (...args: any[]) => void) => fn(...args);

function transaction() {
    return function transaction(this: Record<TControlFields, any>, tx: () => void, onchange: OnchangeCallback) {
        const state = fields.reduce((acc, field) => {
            acc[field] = this[field];

            return acc;
        }, {} as Record<TControlFields, any>);

        tx();

        const changed: TControlFields[] = fields.filter((field) => this[field] !== state[field]);

        if (changed.length) {
            onchange(changed.map((field) => [ field, state[field], this[field] ]));
        }
    };
}

function events() {
    const subscriptions = fields.reduce((acc, field) => {
        acc[field] = new Set<TSubscription>();

        return acc;
    }, {} as Record<TControlFields, Set<TSubscription>>);

    return {
        subscribe(field: TControlFields, handler: TSubscription) {
            subscriptions[field].add(handler);

            return () => {
                subscriptions[field].delete(handler);
            };
        },

        notify(field: TControlFields, prev: any, next: any) {
            if (subscriptions[field].size) {
                [ ...subscriptions[field] ].forEach(call(next, prev));
            }
        },
    }
}

