import { NOOP_TRANSFORM, ValidationError, INativeParser, SmartType } from "./common"

class SmartString<INPUT> extends SmartType<INPUT, string> {

    /** Validate that the string is at least this many characters. */
    minLen(min: number) {
        return new SmartString(this,
            `minLen=${min}`,
            (s) => { if (s.length < min) throw new ValidationError(this, s); return s }
        )
    }
}

/** Inputs anything into a number. */
class NativeString implements INativeParser<string> {
    public readonly description = "string"

    input(x: unknown, strict: boolean): string {
        if (typeof x === "string") return x
        if (!strict) {
            return String(x)
        }
        throw new ValidationError(this, x)
    }

    static SINGLETON = new NativeString()
}

/** Generic string */
export function STR() {
    return new SmartString(NativeString.SINGLETON, NativeString.SINGLETON.description, NOOP_TRANSFORM)
}



