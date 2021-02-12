import * as bson from 'bson';
import parse from '../src';
import { Options, ParseMode } from '../src/options';

it('should correctly parse a valid object', function() {
  expect(parse('{_id:"hello"}')).toEqual({ _id: 'hello' });
});

it('should accept an empty object', function() {
  expect(parse('{ }')).toEqual({});
});

it('should parse special globals / values', function() {
  const input = `{
    infinity: Infinity,
    NaN: NaN,
    undefined: undefined,
    null: null
  }`;
  expect(parse(input)).toEqual({
    infinity: Infinity,
    NaN: NaN,
    undefined: undefined,
    null: null,
  });
});

it('should accept a complex query', function() {
  expect(
    parse(`{
    RegExp: /test/ig,
    Binary: new Binary(''),
    BinData: BinData(3, 'dGVzdAo='),
    UUID: UUID('3d37923d-ab8e-4931-9e46-93df5fd3599e'),
    Code: Code('function() {}'),
    DBRef: new DBRef('tests', new ObjectId("5e159ba7eac34211f2252aaa"), 'test'),
    Decimal128: new Decimal128("128"),
    NumberDecimal: NumberDecimal("12345"),
    Double: Double(10.1),
    Int32: new Int32(10),
    NumberInt: NumberInt("100"),
    Long: new Long(234, 200),
    NumberLong: NumberLong(123456789),
    Int64: new Int64(120),
    Map: Map([['key', 'value']]),
    MaxKey: MaxKey(),
    MinKey: MinKey(),
    ObjectID: ObjectID("5e159ba7eac34211f2252aaa"),
    ObjectId: ObjectId("5e159ba7eac34211f2252aaa"),
    Symbol: Symbol('symbol'),
    Timestamp: Timestamp(123, 456),
    ISODate: ISODate("2020-01-01 12:00:00"),
    Date: Date("2020-01-01 12:00:00")
  }`)
  ).toEqual({
    RegExp: /test/gi,
    Binary: new bson.Binary('' as any),
    BinData: new bson.Binary(Buffer.from('dGVzdAo=', 'base64'), 3),
    UUID: new bson.Binary(
      Buffer.from('3d37923dab8e49319e4693df5fd3599e', 'hex'),
      4
    ),
    Code: new bson.Code('function() {}'),
    DBRef: new bson.DBRef(
      'tests',
      new bson.ObjectId('5e159ba7eac34211f2252aaa'),
      'test'
    ),
    Decimal128: bson.Decimal128.fromString('128'),
    NumberDecimal: bson.Decimal128.fromString('12345'),
    Double: new bson.Double(10.1),
    Int32: new bson.Int32(10),
    NumberInt: 100,
    Long: new bson.Long(234, 200),
    NumberLong: bson.Long.fromNumber(123456789),
    Int64: bson.Long.fromNumber(120),
    Map: new (bson as any).Map([['key', 'value']]),
    MaxKey: new bson.MaxKey(),
    MinKey: new bson.MinKey(),
    ObjectID: new bson.ObjectID('5e159ba7eac34211f2252aaa'),
    ObjectId: new bson.ObjectId('5e159ba7eac34211f2252aaa'),
    Symbol: new (bson as any).BSONSymbol('symbol'),
    Timestamp: new bson.Timestamp(123, 456),
    ISODate: new Date('2020-01-01 12:00:00'),
    Date: new Date('2020-01-01 12:00:00'),
  });
});

it('should support binary operators (like plus / minus)', function() {
  expect(
    parse(`{
    _id: ObjectId("5e159ba7eac34211f2252aaa"),
    created: Timestamp(10 + 10, 10),
    filter: { year: { $gte: 2021 - (1/2 + 0.5 - (5 * 0)) } },
  }`)
  ).toEqual({
    _id: new bson.ObjectId('5e159ba7eac34211f2252aaa'),
    created: new bson.Timestamp(20, 10),
    filter: { year: { $gte: 2020 } },
  });
});

it('should support parsing array operators', function() {
  expect(
    parse(`[{
    "$match": {
      "released": {
        "$gte": {
          "$date": {
            "$numberLong": "-1806710400000"
          }
        }
      }
    }
  },
  {
    "$group": {
      "_id": {
        "__alias_0": "$year"
      },
      "__alias_1": {
        "$sum": 1
      }
    }
  }]`)
  ).toEqual([
    {
      $match: {
        released: {
          $gte: {
            $date: {
              $numberLong: '-1806710400000',
            },
          },
        },
      },
    },
    {
      $group: {
        _id: {
          __alias_0: '$year',
        },
        __alias_1: {
          $sum: 1,
        },
      },
    },
  ]);
});

it('should not allow calling functions that do not exist', function() {
  expect(parse('{ date: require("") }')).toEqual('');
});

describe('Function calls', function() {
  const options: Partial<Options> = {
    mode: ParseMode.Strict,
    allowMethods: true,
  };

  describe('Should deny calls if functions are not allowed', function() {
    it('reject calls to Math', function() {
      expect(
        parse('{ floor: Math.floor(5.5) }', {
          mode: ParseMode.Strict,
          allowMethods: false,
        })
      ).toEqual('');
    });

    describe.each(['new Date', 'new ISODate', 'Date', 'ISODate'])(
      'Prevent calling function calls on "%s"',
      dateFn => {
        it('reject calls', function() {
          expect(
            parse(`{ date: (${dateFn}(0)).getFullYear() }`, {
              mode: ParseMode.Strict,
              allowMethods: false,
            })
          ).toEqual('');
        });
      }
    );
  });

  describe('Math', function() {
    it('should allow parsing while using functions from Math', function() {
      const input = `{
          abs: Math.abs(-10),
          acos: Math.acos(1),
          acosh: Math.acosh(2),
          asin: Math.asin(1),
          asinh: Math.asinh(1),
          atan: Math.atan(1),
          atan2: Math.atan2(2, 5),
          atanh: Math.atanh(0.5),
          cbrt: Math.cbrt(64),
          ceil: Math.ceil(5.5),
          clz32: Math.clz32(1000),
          cos: Math.cos(0.5),
          cosh: Math.cosh(0.5),
          exp: Math.exp(2),
          expm1: Math.expm1(2),
          floor: Math.floor(5.5),
          fround: Math.fround(5.05),
          hypot: Math.hypot(5, 12),
          imul: Math.imul(3, 4),
          log: Math.log(8),
          log10: Math.log10(100),
          log1p: Math.log1p(1),
          log2: Math.log2(8),
          max: Math.max(1, 2, 3),
          min: Math.min(1, 2, 3),
          pow: Math.pow(2, 3),
          round: Math.round(-5.5),
          sign: Math.sign(-10),
          sin: Math.sin(0.5),
          sinh: Math.sinh(0.5),
          sqrt: Math.sqrt(81),
          tan: Math.tan(1),
          tanh: Math.tanh(1),
          trunc: Math.trunc(30.5),
        }`;
      expect(parse(input, options)).toEqual({
        abs: 10,
        acos: Math.acos(1),
        acosh: Math.acosh(2),
        asin: Math.asin(1),
        asinh: Math.asinh(1),
        atan: Math.atan(1),
        atan2: Math.atan2(2, 5),
        atanh: Math.atanh(0.5),
        cbrt: 4,
        ceil: 6,
        clz32: 22,
        cos: Math.cos(0.5),
        cosh: Math.cosh(0.5),
        exp: Math.exp(2),
        expm1: Math.expm1(2),
        floor: 5,
        fround: Math.fround(5.05),
        hypot: 13,
        imul: 12,
        log: Math.log(8),
        log10: 2,
        log1p: Math.log1p(1),
        log2: 3,
        max: 3,
        min: 1,
        pow: 8,
        round: -5,
        sign: -1,
        sin: Math.sin(0.5),
        sinh: Math.sinh(0.5),
        sqrt: 9,
        tan: Math.tan(1),
        tanh: Math.tanh(1),
        trunc: 30,
      });
    });

    it('should be able to handle math expressions', function() {
      expect(
        parse('{ simpleCalc: (5 * Math.floor(5.5) + Math.ceil(5.5)) }', options)
      ).toEqual({ simpleCalc: 31 });
    });

    it('should prevent invalid functions', function() {
      expect(parse('{ simpleCalc: Math.totallyLegit(5) }', options)).toEqual(
        ''
      );
    });
  });

  describe('Functions', () => {
    it('Should allow functions as object properties', function() {
      expect(parse('{ $where: function() { this.x = 1 }}', options)).toEqual(
        {
          $where: 'function() { this.x = 1 }'
        }
      );
    });

    it('Should allow multiline functions', function() {
      expect(parse('{ $where: function\n()\n{\nthis.x = 1\n}}', options)).toEqual(
        {
          $where: 'function\n()\n{\nthis.x = 1\n}'
        }
      );
    });

    it('Should allow $expr queries', function() {
      expect(parse(`{
        $expr: {
          $function: {
            body: function(name) { return hex_md5(name) == "15b0a220baa16331e8d80e15367677ad"; },
            args: [ "$name" ],
            lang: "js"
          }
        }
      }`)).toEqual({
        $expr: {
          $function: {
            body: 'function(name) { return hex_md5(name) == "15b0a220baa16331e8d80e15367677ad"; }',
            args: [ "$name" ],
            lang: "js"
          }
        }
      });
    });
  });

  describe('Date', function() {
    it('should allow calling .now()', function() {
      const dateSpy = jest.spyOn(Date, 'now');
      dateSpy.mockReturnValue(1578974885017);

      expect(parse('{ now: Date.now() }', options)).toEqual({
        now: 1578974885017,
      });

      dateSpy.mockRestore();
    });

    describe.each(['new Date', 'new ISODate', 'Date', 'ISODate'])(
      'Date allow using member methods with "%s"',
      dateFn => {
        it('should allow member expressions', function() {
          const input = `{
          getDate: (${dateFn}(1578974885017)).getDate(),
          getDay: (${dateFn}(1578974885017)).getDay(),
          getFullYear: (${dateFn}(1578974885017)).getFullYear(),
          getHours: (${dateFn}(1578974885017)).getHours(),
          getMilliseconds: (${dateFn}(1578974885017)).getMilliseconds(),
          getMinutes: (${dateFn}(1578974885017)).getMinutes(),
          getMonth: (${dateFn}(1578974885017)).getMonth(),
          getSeconds: (${dateFn}(1578974885017)).getSeconds(),
          getTime: (${dateFn}(1578974885017)).getTime(),
          getTimezoneOffset: (${dateFn}(1578974885017)).getTimezoneOffset(),
          getUTCDate: (${dateFn}(1578974885017)).getUTCDate(),
          getUTCDay: (${dateFn}(1578974885017)).getUTCDay(),
          getUTCFullYear: (${dateFn}(1578974885017)).getUTCFullYear(),
          getUTCHours: (${dateFn}(1578974885017)).getUTCHours(),
          getUTCMilliseconds: (${dateFn}(1578974885017)).getUTCMilliseconds(),
          getUTCMinutes: (${dateFn}(1578974885017)).getUTCMinutes(),
          getUTCMonth: (${dateFn}(1578974885017)).getUTCMonth(),
          getUTCSeconds: (${dateFn}(1578974885017)).getUTCSeconds(),
          getYear: (${dateFn}(1578974885017)).getYear(),
          setDate: (${dateFn}(1578974885017)).setDate(24),
          setFullYear: (${dateFn}(1578974885017)).setFullYear(2010),
          setHours: (${dateFn}(1578974885017)).setHours(23),
          setMilliseconds: (${dateFn}(1578974885017)).setMilliseconds(1),
          setMinutes: (${dateFn}(1578974885017)).setMinutes(1),
          setMonth: (${dateFn}(1578974885017)).setMonth(1),
          setSeconds: (${dateFn}(1578974885017)).setSeconds(59),
          setTime: (${dateFn}(1578974885017)).setTime(10),
          setUTCDate: (${dateFn}(1578974885017)).setUTCDate(24),
          setUTCFullYear: (${dateFn}(1578974885017)).setUTCFullYear(2010),
          setUTCHours: (${dateFn}(1578974885017)).setUTCHours(23),
          setUTCMilliseconds: (${dateFn}(1578974885017)).setUTCMilliseconds(1),
          setUTCMinutes: (${dateFn}(1578974885017)).setUTCMinutes(1),
          setUTCMonth: (${dateFn}(1578974885017)).setUTCMonth(1),
          setUTCSeconds: (${dateFn}(1578974885017)).setUTCSeconds(59),
          setYear: (${dateFn}(1578974885017)).setYear(96),
          toISOString: (${dateFn}(1578974885017)).toISOString(),
       }`;

          expect(parse(input, options)).toEqual({
            getDate: 14,
            getDay: 2,
            getFullYear: 2020,
            getHours: 15,
            getMilliseconds: 17,
            getMinutes: 8,
            getMonth: 0,
            getSeconds: 5,
            getTime: 1578974885017,
            getTimezoneOffset: -660,
            getUTCDate: 14,
            getUTCDay: 2,
            getUTCFullYear: 2020,
            getUTCHours: 4,
            getUTCMilliseconds: 17,
            getUTCMinutes: 8,
            getUTCMonth: 0,
            getUTCSeconds: 5,
            getYear: 120,
            setDate: 1579838885017,
            setFullYear: 1263442085017,
            setHours: 1579003685017,
            setMilliseconds: 1578974885001,
            setMinutes: 1578974465017,
            setMonth: 1581653285017,
            setSeconds: 1578974939017,
            setTime: 10,
            setUTCDate: 1579838885017,
            setUTCFullYear: 1263442085017,
            setUTCHours: 1579043285017,
            setUTCMilliseconds: 1578974885001,
            setUTCMinutes: 1578974465017,
            setUTCMonth: 1581653285017,
            setUTCSeconds: 1578974939017,
            setYear: 821592485017,
            toISOString: '2020-01-14T04:08:05.017Z',
          });
        });

        it('should prevent invalid functions', function() {
          const input = `{ evilDate: (${dateFn}(0)).totallyLegit(5) }`;
          expect(parse(input, options)).toEqual('');
        });
      }
    );
  });

  // Testing more realistic examples of using the Date object
  describe.each([
    [
      '{ dayOfYear: Math.round((new Date(1578974885017).setHours(23) - new Date(new Date(1578974885017).getYear()+1900, 0, 1, 0, 0, 0))/1000/60/60/24)}',
      { dayOfYear: 14 },
    ],
    [
      '{ _id: { $gte: ObjectId(Math.floor((new Date(1578974885017)).setSeconds(-2592000)/1000).toString(16)+"0000000000000000")}, event: "passing_tests"}',
      {
        _id: { $gte: new bson.ObjectId('5df5b1a00000000000000000') },
        event: 'passing_tests',
      },
    ],
  ])('complicated parsing of Math and Date', (input, result) => {
    it(`should parse ${input} as ${JSON.stringify(result)}`, function() {
      expect(parse(input, options)).toEqual(result);
    });
  });
});

describe('Comments', function() {
  const options: Partial<Options> = {
    mode: ParseMode.Strict,
    allowComments: true,
  };

  const input = `{
    this: 'is', // a test
    to: 'see' /* if comments work as expected */
  }`;

  it('should disallow comment mode if turned off', function() {
    const noCommentOption = { mode: ParseMode.Strict, allowComments: false };

    expect(parse(input, noCommentOption)).toEqual('');
  });

  it('should allow // and /* */ comments', function() {
    expect(parse(input, options)).toEqual({
      this: 'is',
      to: 'see',
    });
  });
});

it('should not allow calling IIFE', function() {
  expect(parse('{ date: (function() { return "10"; })() }')).toEqual('');
});

it('should prevent attempting to break the sandbox', function() {
  const input =
    "{ exploit: clearImmediate.constructor('return process;')().exit(1) }";
  expect(parse(input)).toEqual('');
});

it('should correctly parse NumberLong and Int64 bigger than Number.MAX_SAFE_INTEGER', function() {
  expect(
    parse("{ n: NumberLong('345678654321234552') }"
  ).n.toString()).toEqual('345678654321234552');

  expect(
    parse("{ n: Int64('345678654321234552') }"
  ).n.toString()).toEqual('345678654321234552');
});
