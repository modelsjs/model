import type { TSubscription, TModelFields } from './types';
import { Model, ModelState } from './model';
import { ModelError } from './error';

const call = (...args: any[]) => (fn: (...args: any[]) => void) => fn(...args);

export class ModelControl {
    public subscribtions: {
        [F in TModelFields]: Set<TSubscription<Model, F>>
    }

    public get state(): ModelState {
        if (this.error) {
            return ModelState.Error;
        } else if (this.result) {
            return ModelState.Ready;
        } else {
            return ModelState.Initial;
        }
    }

    public error: Nullable<ModelError> = null;

    public result: Nullable<OJSON> = null;

    public revision: number = 1;

    constructor() {
        this.subscribtions = {
            state: new Set<TSubscription<Model, 'state'>>(),
            error: new Set<TSubscription<Model, 'error'>>(),
            result: new Set<TSubscription<Model, 'result'>>(),
            revision: new Set<TSubscription<Model, 'revision'>>(),
        };
    }

    public set(data: Nullable<OJSON | ModelError>) {
        this.transaction(() => {
            if (data instanceof ModelError) {
                this.error = data || null;
                this.result = null;
            } else {
                this.error = null;
                this.result = data || null;
            }
        });
    }

    public subscribe(field: TModelFields, handler: TSubscription) {
        this.subscribtions[field].add(handler);
    }

    public unsubscribe(field: TModelFields, handler: TSubscription) {
        this.subscribtions[field].delete(handler);
    }

    private transaction(tx: () => void) {
        const {state, error, result, revision} = this;

        tx();

        if ([
            this.check('state', state),
            this.check('error', error),
            this.check('result', result)
        ].some(Boolean)) {
            this.notify('revision', revision, ++this.revision);
        }

    }

    private check(field: TModelFields, prev: any): boolean {
        const next = this[field];

        if (next !== prev) {
            this.notify(field, prev, next);

            return true;
        }

        return false;
    }

    private notify(field: TModelFields, prev: any, next: any) {
        if (this.subscribtions[field].size) {
            [...this.subscribtions[field]].forEach(call(next, prev));
        }
    }
}