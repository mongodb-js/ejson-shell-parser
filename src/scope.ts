import bson from 'bson';

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
  ISODate: function(s: any) {
    return s === undefined
      ? new Date()
      : new Date(...(Array.from(arguments) as []));
  },
  Date: function(s: any) {
    return s === undefined
      ? new Date()
      : new Date(...(Array.from(arguments) as []));
  },
  Math: function() {
    return Math;
  },
};

const ALLOWED_MEMBER_EXPRESSIONS: { [x: string]: Set<string> } = {
  Math: new Set([
    'abs',
    'acos',
    'acosh',
    'asin',
    'asinh',
    'atan',
    'atan2',
    'atanh',
    'cbrt',
    'ceil',
    'clz32',
    'cos',
    'cosh',
    'exp',
    'expm1',
    'floor',
    'fround',
    'hypot',
    'imul',
    'log',
    'log10',
    'log1p',
    'log2',
    'max',
    'min',
    'pow',
    'round',
    'sign',
    'sin',
    'sinh',
    'sqrt',
    'tan',
    'tanh',
    'trunc',
  ]),
  Date: new Set([
    'getDate',
    'getDay',
    'getFullYear',
    'getHours',
    'getMilliseconds',
    'getMinutes',
    'getMonth',
    'getSeconds',
    'getTime',
    'getTimezoneOffset',
    'getUTCDate',
    'getUTCDay',
    'getUTCFullYear',
    'getUTCHours',
    'getUTCMilliseconds',
    'getUTCMinutes',
    'getUTCMonth',
    'getUTCSeconds',
    'getYear',
    'now',
    'setDate',
    'setFullYear',
    'setHours',
    'setMilliseconds',
    'setMinutes',
    'setMonth',
    'setSeconds',
    'setTime',
    'setUTCDate',
    'setUTCFullYear',
    'setUTCHours',
    'setUTCMilliseconds',
    'setUTCMinutes',
    'setUTCMonth',
    'setUTCSeconds',
    'setYear',
  ]),
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
    ALLOWED_MEMBER_EXPRESSIONS[object].has(property)
  );
}
