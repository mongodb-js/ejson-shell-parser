import * as bson from 'bson';

function NumberLong(v: any) {
  if (typeof v === 'string') {
    return bson.Long.fromString(v);
  } else {
    return bson.Long.fromNumber(v);
  }
}

const SCOPE: { [x: string]: Function } = {
  RegExp: RegExp,
  Binary: function(buffer: any, subType: any) {
    return new bson.Binary(buffer, subType);
  },
  BinData: function(t: any, d: any) {
    return new bson.Binary(Buffer.from(d, 'base64'), t);
  },
  UUID: function(u: any) {
    return new bson.Binary(Buffer.from(u.replace(/-/g, ''), 'hex'), 4);
  },
  Code: function(c: any, s: any) {
    return new bson.Code(c, s);
  },
  DBRef: function(namespace: any, oid: any, db: any, fields: any) {
    return new (bson as any).DBRef(namespace, oid, db, fields);
  },
  Decimal128: function(s: any) {
    return bson.Decimal128.fromString(s);
  },
  NumberDecimal: function(s: any) {
    return bson.Decimal128.fromString(s);
  },
  Double: function(s: any) {
    return new bson.Double(s);
  },
  Int32: function(i: any) {
    return new bson.Int32(i);
  },
  NumberInt: function(s: any) {
    return parseInt(s, 10);
  },
  Long: function(low: any, high: any) {
    return new bson.Long(low, high);
  },
  NumberLong: NumberLong,
  Int64: NumberLong,
  Map: function(arr: any) {
    return new (bson as any).Map(arr);
  },
  MaxKey: function() {
    return new bson.MaxKey();
  },
  MinKey: function() {
    return new bson.MinKey();
  },
  ObjectID: function(i: any) {
    return new bson.ObjectID(i);
  },
  ObjectId: function(i: any) {
    return new bson.ObjectID(i);
  },
  Symbol: function(i: any) {
    return new (bson as any).BSONSymbol(i);
  },
  Timestamp: function(low: any, high: any) {
    if (typeof low === 'number' && typeof high === 'number') {
      // https://www.mongodb.com/docs/manual/reference/bson-types/#timestamps
      // low == i
      // high == t
      return new bson.Timestamp(high, low);
    }

    return new bson.Timestamp(low, high);
  },
  ISODate: function(...args: any[]) {
    // casting our arguments as an empty array because we don't know
    // the length of our arguments, and should allow users to pass what
    // they want as date arguments
    return new Date(...(args as []));
  },
  Date: function(...args: any[]) {
    // casting our arguments as an empty array because we don't know
    // the length of our arguments, and should allow users to pass what
    // they want as date arguments
    return new Date(...(args as []));
  },
};

export const GLOBALS: { [x: string]: any } = Object.freeze({
  Infinity: Infinity,
  NaN: NaN,
  undefined: undefined,
});

type AllowedMethods = { [methodName: string]: boolean };

/**
 * Internal object of Member -> Allowed methods on that member.
 *
 * Allowed Methods is allowed to be a string, which just indirects to another member.
 * (Pretty much only for ISODate to save on some boilerplate)
 */
type ClassExpressions = {
  [member: string]: {
    class: typeof Math | typeof Date;
    allowedMethods: AllowedMethods | string;
  };
};

const ALLOWED_CLASS_EXPRESSIONS: ClassExpressions = {
  Math: {
    class: Math,
    allowedMethods: {
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
  },
  Date: {
    class: Date,
    allowedMethods: {
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
      toISOString: true,
    },
  },
  ISODate: {
    class: Date,
    allowedMethods: 'Date',
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

export function isMethodWhitelisted(member: string, property: string): boolean {
  if (ALLOWED_CLASS_EXPRESSIONS[member]) {
    const allowedMethods = ALLOWED_CLASS_EXPRESSIONS[member].allowedMethods;

    if (typeof allowedMethods === 'string') {
      return (ALLOWED_CLASS_EXPRESSIONS[allowedMethods]
        .allowedMethods as AllowedMethods)[property];
    }
    return allowedMethods[property];
  }

  return false;
}

export function getClass(member: string) {
  if (ALLOWED_CLASS_EXPRESSIONS[member]) {
    return ALLOWED_CLASS_EXPRESSIONS[member].class;
  }
  throw new Error(`Attempted to access member '${member}' that doesn't exist`);
}
