import { ValidationError, transformer, SmartType, JsonFor, JSONType } from "./common"

class SmartArray<T, J extends JSONType, EL extends SmartType<T, J>> extends SmartType<T[], J[]> {

    // We carry along the smart type belonging to the array elements.
    constructor(
        public readonly elementType: EL,
    ) {
        super(elementType.description + '[]')
    }

    get constructorArgs() { return [this.elementType] }

    input(x: unknown, strict: boolean): T[] {
        if (!Array.isArray(x)) throw new ValidationError(this, x, "Expected array")
        return x.map(el => this.elementType.input(el, strict))
    }

    toJSON(x: T[]) {
        return x.map(el => this.elementType.toJSON(el))
    }

    fromJSON(x: J[]): T[] {
        return x.map(el => this.elementType.fromJSON(el))
    }

    /** Validate that the array has at least this elements. */
    minLen(min: number) {
        return transformer<T[], this>(this,
            `minLen=${min}`,
            (a) => {
                if (a.length < min) throw new ValidationError(this, a);
                return a
            }
        )
    }
}

/** Generic string */
export function ARRAY<T, J extends JSONType>(elementType: SmartType<T, J>) {
    return new SmartArray<T, J, typeof elementType>(elementType)
}
