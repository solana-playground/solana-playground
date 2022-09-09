/* tslint:disable */
export function rustfmt(arg0: string): RustfmtResult;

export class RustfmtResult {
free(): void;

 code(): string;

 error(): string;

}
