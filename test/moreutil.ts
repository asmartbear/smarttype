import * as T from "./testutil"
import * as V from "../src/common"

/** These values pass validation and are identical in their final form. */
export function passes(strict: boolean, ty: V.SmartType, ...x: unknown[]) {
    for (const y of x) {
        try {
            T.eq(ty.input(y, strict), y)
        } catch (e) {
            throw new Error(
                `Expected validation to succeed for value: ${JSON.stringify(y)} ` +
                `(type: ${typeof y})`
            );
        }
    }
}

/** These value fail validation. */
export function fails(strict: boolean, a: V.SmartType, ...x: unknown[]) {
    for (const y of x) {
        T.throws(() => a.input(y, strict), V.ValidationError, JSON.stringify(y))
        T.eq(a.inputReturnError(y, strict) instanceof V.ValidationError, true)
    }
}

export function toFromJSON<U, J extends V.JSONType>(m: V.IMarshallJson<U, J>, from: U, to: J) {
    const js = m.toJSON(from)
    T.eq(js, to)
    T.eq(m.fromJSON(to), from)
}
