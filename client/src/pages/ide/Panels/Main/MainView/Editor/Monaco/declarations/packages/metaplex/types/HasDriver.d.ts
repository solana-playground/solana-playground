export declare type HasDriver<T> = {
    driver: () => T;
    setDriver: (newDriver: T) => void;
};
