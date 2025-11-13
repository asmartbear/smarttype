import { ValidationError, INativeParser, SmartType, JSONType, NativeFor, ValuesOf } from "./common"

class SmartTuple2<
    INPUT,
    A extends SmartType<any>,
    B extends SmartType<any>,
> extends SmartType<INPUT, [NativeFor<A>, NativeFor<B>], JSONType[]> {

    constructor(
        public readonly types: [A, B],
        source: INativeParser<INPUT>, description?: string, transform?: (x: INPUT) => [NativeFor<A>, NativeFor<B>],
    ) {
        super(source, description, transform)
    }

    toJSON(x: [NativeFor<A>, NativeFor<B>]): JSONType[] {
        return x.map((y, i) => this.types[i].toJSON(y))
    }

    fromJSON(js: JSONType[]) {
        return js.map((x, i) => this.types[i].fromJSON(x)) as [NativeFor<A>, NativeFor<B>]
    }
}

/** Inputs various array-like things into an array, recursively resolving things inside that array. */
class TupleSource<A extends SmartType<any>, B extends SmartType<any>, Native = [NativeFor<A>, NativeFor<B>]> implements INativeParser<Native> {

    constructor(public readonly types: [A, B]) { }

    get description(): string {
        return '[' + this.types.map(t => t.description).join(',') + ']'
    }

    input(x: unknown, strict: boolean) {
        if (!Array.isArray(x)) throw new ValidationError(this, x, "Expected array")
        if (x.length !== this.types.length) throw new ValidationError(this, x, "Tuple of the wrong length")
        return x.map((y, i) => this.types[i].input(y, strict)) as Native
    }
}

/** An array of fixed length and types */
export function TUPLE<A extends SmartType<any>, B extends SmartType<any>>(a: A, b: B) {
    const source = new TupleSource([a, b] as const)
    return new SmartTuple2(source.types, source)
}
