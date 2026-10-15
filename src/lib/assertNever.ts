/**
 * Exhaustiveness guard for discriminated-union `switch` statements. Calling
 * this in a `default` branch forces a COMPILE error if a new union member is
 * added but not handled, because only `never` is assignable to `x`.
 */
export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${String(x)}`)
}
