import * as T from "./testutil"
import { failsWithErrorRegex } from "./moreutil"
import { reverseEngineerType as REV } from "../src/reverse"

class MyTestClassA {
    toString() { return "A" }
}

class MyTestClassB extends MyTestClassA {
    parent: MyTestClassA | null = null
    toString() { return "B" }
}

test('reverse-engineer basics', () => {
    T.be(REV(undefined).description, 'undefined')
    T.be(REV(null).description, 'null')

    T.be(REV(false).description, 'boolean')
    T.be(REV(true).description, 'boolean')

    T.be(REV(0).description, 'number')
    T.be(REV(0.1).description, 'number')
    T.be(REV(-912.2).description, 'number')
    T.be(REV(Number.EPSILON).description, 'number')
    T.be(REV(Number.NaN).description, 'number')
    T.be(REV(Number.POSITIVE_INFINITY).description, 'number')

    T.be(REV("").description, 'string')
    T.be(REV("foo").description, 'string')
})

test('reverse-engineer unsupported', () => {
    T.throws(() => REV(() => { }))
    T.throws(() => REV(parseInt))
    T.throws(() => REV(Symbol("foo")))
    T.throws(() => REV(BigInt(12345)))
})

test('reverse-engineer arrays', () => {
    // cannot be empty
    T.throws(() => REV([]))

    // single type
    T.be(REV([1, 2, 3]).description, 'number[]')
    T.be(REV([true]).description, 'boolean[]')

    // mixed types aren't currently supported; we could look through all elements and create an alternation if we wanted to
    T.be(REV([true, 1, "hi", 2, false]).description, 'boolean[]')
})

test('reverse-engineer fields', () => {
    T.be(REV({}).description, '{}')
    T.be(REV({ a: 123 }).description, '{a:number}')
    T.be(REV({ a: 123, b: "foo" }).description, '{a:number,b:string}')
    T.eq(REV({ a: 123, b: "foo" }).toJSON({ a: 123, b: "foo" }), { a: 123, b: "foo" })
    T.eq(REV({ a: 123, b: "foo" }).input({ a: 123, b: "foo", c: "ignored" }), { a: 123, b: "foo" })

    // With options
    const ief = REV({ a: 123, b: "foo" }, { ignoreExtraFields: false })
    T.be(ief.description, '{a:number,b:string}')
    T.eq(ief.input({ a: 1, b: "bar" }), { a: 1, b: "bar" })
    T.throws(() => ief.input({ a: 1, b: "bar", c: "extra" }))
})

test('reverse-engineer opaque objects', () => {
    const a = new MyTestClassA()
    const at = REV(a)
    T.be(at.description, 'MyTestClassA')
    T.throws(() => at.toJSON(a))

    const b = new MyTestClassB()
    const bt = REV(b)
    T.be(bt.description, 'MyTestClassB')
    T.throws(() => bt.toJSON(b))

    T.be(at.input(a), a)
    T.be(at.input(b), b)

    T.be(bt.input(b), b)
    failsWithErrorRegex(bt, a, /MyTestClassB\b.*\bMyTestClassA/)
})

test('reverse-engineer classes', () => {
    const a = new MyTestClassA()
    const at = REV(MyTestClassA)
    T.be(at.description, 'MyTestClassA')
    T.throws(() => at.toJSON(a))

    const b = new MyTestClassB()
    const bt = REV(MyTestClassB)
    T.be(bt.description, 'MyTestClassB')
    T.throws(() => bt.toJSON(b))

    T.be(at.input(a), a)
    T.be(at.input(b), b)

    T.be(bt.input(b), b)
    failsWithErrorRegex(bt, a, /MyTestClassB\b.*\bMyTestClassA/)
})

test('reverse engineer classes inside objects', () => {
    const a = new MyTestClassA()
    const b = new MyTestClassB()
    const ty = REV({ a: MyTestClassA, b: MyTestClassB })
    T.be(ty.description, '{a:MyTestClassA,b:MyTestClassB}')
    T.eq(ty.input({ a, b }), { a, b })
    T.eq(ty.input({ a: b, b }), { a: b, b })
    failsWithErrorRegex(ty, { a, b: a }, /MyTestClassB\b.*\bMyTestClassA/)
})

test('reverse engineer known objects', () => {
    const d = new Date(1763317395302)
    const re = /foo/gi
    const ty = REV({ d, re })
    const obj = { d, re }
    T.be(ty.description, '{d:date,re:regexp}')
    T.eq(ty.isOfType(obj, true), true)
    T.eq(ty.input(obj), obj)
    T.eq(ty.toJSON(obj), { d: 1763317395302, re: "/foo/gi" }, "shows we wrapped the objects properly")
})