import * as bson from 'bson';

const SCOPE: { [x: string]: Function } = {
  RegExp: RegExp,
  Binary: bson.Binary,
  BinData: function(t: any, d: any) {
    return new bson.Binary(Buffer.from(d, 'base64'), t);
  },
  UUID: function(u: any) {
    return new bson.Binary(Buffer.from(u.replace(/-/g, ''), 'hex'), 4);
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
  ISODate: function(...s: any[]) {
    // casting our arguments as an empty array because we don't know
    // the length of our arguments, and should allow users to pass what
    // they want as date arguments
    return s === undefined ? new Date() : new Date(...(s as []));
  },
  Date: function(...s: any[]) {
    // casting our arguments as an empty array because we don't know
    // the length of our arguments, and should allow users to pass what
    // they want as date arguments
    return s === undefined ? new Date() : new Date(...(s as []));
  },
  Math: function() {
    return Math;
  },
};

const ALLOWED_MEMBER_EXPRESSIONS: { [x: string]: { [k: string]: boolean } } = {
  Math: {
    abs: true,
    acos: true,
    acosh: true,
    asin: true,
    asinh: true,
    atan: true,
    atan2: true,
    atanh: true,
    cbrt: true,
    ceil: true,
    clz32: true,
    cos: true,
    cosh: true,
    exp: true,
    expm1: true,
    floor: true,
    fround: true,
    hypot: true,
    imul: true,
    log: true,
    log10: true,
    log1p: true,
    log2: true,
    max: true,
    min: true,
    pow: true,
    round: true,
    sign: true,
    sin: true,
    sinh: true,
    sqrt: true,
    tan: true,
    tanh: true,
    trunc: true,
  },
  Date: {
    getDate: true,
    getDay: true,
    getFullYear: true,
    getHours: true,
    getMilliseconds: true,
    getMinutes: true,
    getMonth: true,
    getSeconds: true,
    getTime: true,
    getTimezoneOffset: true,
    getUTCDate: true,
    getUTCDay: true,
    getUTCFullYear: true,
    getUTCHours: true,
    getUTCMilliseconds: true,
    getUTCMinutes: true,
    getUTCMonth: true,
    getUTCSeconds: true,
    getYear: true,
    now: true,
    setDate: true,
    setFullYear: true,
    setHours: true,
    setMilliseconds: true,
    setMinutes: true,
    setMonth: true,
    setSeconds: true,
    setTime: true,
    setUTCDate: true,
    setUTCFullYear: true,
    setUTCHours: true,
    setUTCMilliseconds: true,
    setUTCMinutes: true,
    setUTCMonth: true,
    setUTCSeconds: true,
    setYear: true,
  },
};

export const GLOBAL_FUNCTIONS = Object.freeze(Object.keys(SCOPE));

export function getScopeFunction(key: string): Function {
  if (SCOPE[key]) {
    return SCOPE[key];
  }
  throw new Error(
    `Attempted to access scope property '${key}' that doesn't exist`
  );
}

export function allowedMemberProp(object: string, property: string): boolean {
  return (
    ALLOWED_MEMBER_EXPRESSIONS[object] &&
    ALLOWED_MEMBER_EXPRESSIONS[object][property]
  );
}
