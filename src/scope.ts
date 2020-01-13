import bson from 'bson';

type AllowedFieldsWithType<Obj, Type> = {
    [K in keyof Obj]: Obj[K] extends Type ? K : never
};

type ExtractFieldsOfType<Obj, Type> = AllowedFieldsWithType<Obj, Type>[keyof Obj]

const SCOPE: { [x: string]: Function } = {
  RegExp: RegExp,
  Binary: bson.Binary,
  BinData: function(t: any, d: any) {
    return new bson.Binary(Buffer.from(d, "base64"), t);
  },
  UUID: function(u: any) {
    return new bson.Binary(Buffer.from(u.replace(/-/g, ""), "hex"), 4);
  },
  Code: function(c: any, s: any) {
    return new bson.Code(c, s);
  },
  DBRef: bson.DBRef,
  Decimal128: bson.Decimal128,
  NumberDecimal: function(s: any) {
    return bson.Decimal128.fromString(s);
  },
  Double: bson.Double,
  Int32: bson.Int32,
  NumberInt: function(s: any) {
    return parseInt(s, 10);
  },
  Long: bson.Long,
  NumberLong: function(v: any) {
    return bson.Long.fromNumber(v);
  },
  Int64: bson.Long,
  MaxKey: bson.MaxKey,
  MinKey: bson.MinKey,
  ObjectID: bson.ObjectID,
  ObjectId: bson.ObjectID,
  Symbol: bson.Symbol,
  Timestamp: function(low: any, high: any) {
    return new bson.Timestamp(low, high);
  },
  ISODate: function(s: any) {
    return s === undefined ? new Date() : new Date(s);
  },
  Date: function(s: any) {
    return s === undefined ? new Date() : new Date(s);
  }
};

const MEMBER_EXPRESSIONS: { [x: string]: { [x: string]: Function}} = {
  Math: (Object.getOwnPropertyNames(Math) as ExtractFieldsOfType<Math, Function>[]).reduce((acc, fn) => {
    if (typeof Math[fn] === "function") {
      acc[fn] = Math[fn];
    }
    return acc;
  }, {} as {[x: string]: Function})
}

export const GLOBAL_FUNCTIONS = Object.freeze(Object.keys(SCOPE));
export const ALLOWED_MEMBER_OBJECTS = Object.freeze(Object.keys(MEMBER_EXPRESSIONS));

export function getScopeFunction(key: string): Function {
  if (SCOPE[key]) {
    return SCOPE[key];
  }
  throw new Error(`Attempted to access scope property '${key}' that doesn't exist`);
}

export function getMemberObject(key: string): { [x: string]: Function } {
  if (MEMBER_EXPRESSIONS[key]) {
    return MEMBER_EXPRESSIONS[key];
  }
  throw new Error(`Attempted to access member '${key}' that doesn't exist`);
}
