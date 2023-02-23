/**
 * A helper type that defines a model as an opaque type.
 */
export declare type Model<T extends string> = {
    /** A model identifier to distinguish models in the SDK. */
    readonly model: T;
};
/**
 * A helper function that determines whether a value is a model
 * of the given type.
 */
export declare const isModel: <M extends Model<T>, T extends string = M["model"]>(model: T, value: any) => value is M;
/**
 * A helper function to use in type guards asserting that a value is a model.
 * This currently wraps the `assert` method which is not exposed by the library.
 * In the future, we might replace this with a custom error.
 */
export declare function assertModel(condition: boolean, message?: string): asserts condition;
