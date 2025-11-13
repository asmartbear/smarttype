import { ValidationError, INativeParser, SmartType, JSONType } from "./common"

class SmartArray<INPUT, T> extends SmartType<INPUT, T[], JSONType[]> {

    // We carry along the smart type belonging to the array elements.
    constructor(
        public readonly elementType: SmartType<any, T>,
        source: INativeParser<INPUT>, description?: string, transform?: (x: INPUT) => T[],
    ) {
        super(source, description, transform)
    }

    toJSON(x: T[]): JSONType[] {
        return x.map(el => this.elementType.toJSON(el))
    }

    fromJSON(x: JSONType[]): T[] {
        return x.map(el => this.elementType.fromJSON(el))
    }

    /** Validate that the array has at least this elements. */
    minLen(min: number) {
        return new SmartArray(this.elementType, this,
            `minLen=${min}`,
            (a) => {
                if (a.length < min) throw new ValidationError(this, a);
                return a
            }
        )
    }
}

/** Inputs various array-like things into an array, recursively resolving things inside that array. */
class NativeArray<T> implements INativeParser<T[]> {

    constructor(public readonly elementType: SmartType<any, T>) { }

    get description(): string {
        return this.elementType.description + '[]'
    }

    input(x: unknown, strict: boolean): T[] {
        if (!Array.isArray(x)) throw new ValidationError(this, x, "Expected array")
        return x.map(el => this.elementType.input(el, strict))
    }
}

/** Generic string */
export function ARRAY<T>(elementType: SmartType<T>) {
    return new SmartArray<any, T>(elementType, new NativeArray(elementType))
}



