import type { TModelFields, TSubscription } from './types';
import { ModelState } from './model';
import { ModelError } from './error';
import { transaction, events } from './utils';

export class ModelControl {

    private events = events(['state', 'error', 'result', 'revision']);

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

    public set(data: Nullable<OJSON | ModelError>) {
        this.transaction(() => {
            if (data instanceof ModelError) {
                this.error = data || null;
                this.result = null;
            } else {
                this.error = null;
                this.result = data || null;
            }
        }, (changes) => {
            changes.forEach(([field, prev, curr]) => {
                this.events.notify(field, prev, curr);
            });

            this.events.notify('revision', this.revision, ++this.revision);
        });
    }

    public subscribe(field: TModelFields, handler: TSubscription) {
        return this.events.subscribe(field, handler);
    }

    private transaction = transaction(['state', 'error', 'result']);
}