import type { Model } from './index';

export class ModelError extends Error {
    constructor(
        public readonly model: Model,
        message?: string
    ) {
        super(message);

        this.model = model;
    }
}