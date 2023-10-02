import type { Model } from './index';

export class ModelError extends Error {
    constructor(
        public readonly model: Model,
        data?: string | Record<string, any>
    ) {
        super(typeof data === 'string' ? data : data?.message);

        this.model = model;

        if (data && typeof data === 'object') {
            Object.assign(this, data);
        }
    }
}