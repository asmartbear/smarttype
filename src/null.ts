import { ValidationError, SmartType } from "./common"

export const JS_UNDEFINED_SIGNAL = "__undefined__"

class SmartNull extends SmartType<null, null> {

    constructor() {
        super("null")
    }

    input(x: unknown, strict: boolean = true): null {
        if (x === null) return null
        throw new ValidationError(this, x)
    }

    toJSON(x: any): null {
        return null
    }

    fromJSON(x: any) {
        return null
    }
}

/** The `null` value */
export function NIL() {
    return new SmartNull()
}
