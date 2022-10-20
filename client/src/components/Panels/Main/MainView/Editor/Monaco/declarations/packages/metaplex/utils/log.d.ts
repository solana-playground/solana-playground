import debug from 'debug';
export declare const logErrorDebug: debug.Debugger;
export declare const logInfoDebug: debug.Debugger;
export declare const logDebug: debug.Debugger;
export declare const logTrace: debug.Debugger;
export declare const logError: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
export declare const logInfo: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
