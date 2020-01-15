import bson, { ObjectId } from 'bson';
import parse from '../src';
import { Options } from '../src/types';

it('should correctly parse a valid object', function() {
  expect(parse('{_id:"hello"}')).toEqual({ _id: 'hello' });
});

it('should accept an empty object', function() {
  expect(parse('{ }')).toEqual({});
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
    Decimal128: new Decimal128(128),
    NumberDecimal: NumberDecimal("12345"),
    Double: Double(10.1),
    Int32: new Int32(10),
    NumberInt: NumberInt("100"),
    Long: new Long(234, 200),
    NumberLong: NumberLong(123456789),
    Int64: new Int64(120),
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
    Decimal128: new bson.Decimal128(128 as any),
    NumberDecimal: bson.Decimal128.fromString('12345'),
    Double: new bson.Double(10.1),
    Int32: new bson.Int32(10),
    NumberInt: 100,
    Long: new bson.Long(234, 200),
    NumberLong: bson.Long.fromNumber(123456789),
    Int64: bson.Long.fromNumber(120),
    MaxKey: new bson.MaxKey(),
    MinKey: new bson.MinKey(),
    ObjectID: new bson.ObjectID('5e159ba7eac34211f2252aaa'),
    ObjectId: new bson.ObjectId('5e159ba7eac34211f2252aaa'),
    Symbol: new bson.Symbol('symbol'),
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

describe('weak parsing', function() {
  const options: Options = {
    weakParsing: true,
  };
  describe('Math', function() {
    it('should allow parsing while using functions from Math', function() {
      expect(
        parse('{ floor: Math.floor(5.5), ceil: Math.ceil(5.5) }', options)
      ).toEqual({ floor: 5, ceil: 6 });
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

  describe('Date', function() {
    it('should allow member expressions', function() {
      expect(parse('{ year: (new Date(0)).getFullYear() }', options)).toEqual({
        year: 1970,
      });
    });
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
        _id: { $gte: new ObjectId('5df5b1a00000000000000000') },
        event: 'passing_tests',
      },
    ],
  ])('complicated parsing of Math and Date', (input, result) => {
    it(`should parse ${input} as ${JSON.stringify(result)}`, function() {
      expect(parse(input, options)).toEqual(result);
    });
  });
});

it('should not allow calling IIFE', function() {
  expect(parse('{ date: (function() { return "10"; })() }')).toEqual('');
});
