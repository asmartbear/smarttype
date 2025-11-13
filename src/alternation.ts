import { ValidationError, INativeParser, SmartType, JSONType, NativeFor, ValuesOf } from "./common"

type AlternationJSON = {
    t: string,
    x: JSONType,
}

class SmartAlternation<INPUT, ST extends SmartType<any>[]> extends SmartType<INPUT, NativeFor<ST>, AlternationJSON> {

    constructor(
        public readonly types: ST,
        source: INativeParser<INPUT>, description?: string, transform?: (x: INPUT) => NativeFor<ST>,
    ) {
        super(source, description, transform)
    }

    toJSON(x: NativeFor<ST>): AlternationJSON {
        // Find the type that strictly accepts this value, then encode it in JSON
        for (const t of this.types) {
            const y = t.inputReturnError(x, true)
            if (y instanceof ValidationError) continue
            return { t: t.description, x: t.toJSON(x) }
        }
        throw new ValidationError(this, x, "expected validated type for JSON")
    }

    fromJSON(js: AlternationJSON): NativeFor<ST> {
        // Pick off the type and value, then unwrap recursively
        for (const t of this.types) {
            if (t.description === js.t) {
                return t.fromJSON(js.x)
            }
        }
        throw new ValidationError(this, js, "expected alternation type for JSON")
    }
}

/** Inputs various array-like things into an array, recursively resolving things inside that array. */
class AlternationSource<ST extends readonly SmartType<any>[]> implements INativeParser<ValuesOf<ST>> {

    constructor(public readonly types: ST) { }

    get description(): string {
        return '(' + this.types.map(t => t.description).join('|') + ')'
    }

    input(x: unknown, strict: boolean) {
        for (const t of this.types) {
            const y = t.inputReturnError(x, strict)
            if (y instanceof ValidationError) continue
            return y
        }
        throw new ValidationError(this, x)
    }
}

/** Any of these types are acceptable. */
export function OR<ST extends SmartType<any>[]>(...types: ST) {
    return new SmartAlternation(types, new AlternationSource(types))
}
