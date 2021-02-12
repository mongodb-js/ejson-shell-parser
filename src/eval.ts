import {
  UnaryExpression,
  BinaryExpression,
  Node,
  CallExpression,
} from 'estree';
import { getScopeFunction, getClass, GLOBALS } from './scope';

const unaryExpression = (node: UnaryExpression, source: string): any => {
  if (!node.prefix) throw new Error('Malformed UnaryExpression');
  switch (node.operator) {
    case '-':
      return -walk(node.argument, source);
    case '+':
      return +walk(node.argument, source);
    case '!':
      return !walk(node.argument, source);
    case '~':
      return ~walk(node.argument, source);
    default:
      throw new Error(`Invalid UnaryExpression Provided: '${node.operator}'`);
  }
};

const binaryExpression = (node: BinaryExpression, source: string): any => {
  const { left, right } = node;
  switch (node.operator) {
    case '==':
      return walk(left, source) == walk(right, source);
    case '!=':
      return walk(left, source) != walk(right, source);
    case '===':
      return walk(left, source) === walk(right, source);
    case '!==':
      return walk(left, source) !== walk(right, source);
    case '<':
      return walk(left, source) < walk(right, source);
    case '<=':
      return walk(left, source) <= walk(right, source);
    case '>':
      return walk(left, source) > walk(right, source);
    case '>=':
      return walk(left, source) >= walk(right, source);
    case '<<':
      return walk(left, source) << walk(right, source);
    case '>>':
      return walk(left, source) >> walk(right, source);
    case '>>>':
      return walk(left, source) >>> walk(right, source);
    case '+':
      return walk(left, source) + walk(right, source);
    case '-':
      return walk(left, source) - walk(right, source);
    case '*':
      return walk(left, source) * walk(right, source);
    case '/':
      return walk(left, source) / walk(right, source);
    case '%':
      return walk(left, source) % walk(right, source);
    case '**':
      return walk(left, source) ** walk(right, source);
    case '|':
      return walk(left, source) | walk(right, source);
    case '^':
      return walk(left, source) ^ walk(right, source);
    case '&':
      return walk(left, source) & walk(right, source);
    case 'in':
      return walk(left, source) in walk(right, source);
    case 'instanceof':
      return walk(left, source) instanceof walk(right, source);
    default:
      throw new Error(`Invalid BinaryExpression Provided: '${node.operator}'`);
  }
};

const memberExpression = (node: CallExpression, source: string): any => {
  switch (node.callee.type) {
    case 'Identifier': {
      // Handing <Constructor>() and new <Constructor>() cases
      const callee = getScopeFunction(node.callee.name);
      const args = node.arguments.map(arg => walk(arg, source));
      return callee.apply(callee, args);
    }
    case 'MemberExpression': {
      // If they're using a static method or a member
      const calleeThis =
        node.callee.object.type === 'Identifier'
          ? getClass(node.callee.object.name)
          : walk(node.callee.object, source);

      const calleeFn =
        node.callee.property.type === 'Identifier' && node.callee.property.name;

      if (!calleeFn)
        throw new Error('Expected CallExpression property to be an identifier');

      const args = node.arguments.map(arg => walk(arg, source));
      return calleeThis[calleeFn].apply(calleeThis, args);
    }
    default:
      throw new Error('Should not evaluate invalid expressions');
  }
};

const walk = (node: Node, source: string): any => {
  switch (node.type) {
    case 'Identifier':
      if (GLOBALS.hasOwnProperty(node.name)) {
        return GLOBALS[node.name];
      }
      throw new Error(`${node.name} is not a valid Identifier`);
    case 'Literal':
      return node.value;
    case 'UnaryExpression':
      return unaryExpression(node, source);
    case 'BinaryExpression':
      return binaryExpression(node, source);
    case 'ArrayExpression':
      return node.elements.map(node => walk(node, source));
    case 'CallExpression':
    case 'NewExpression':
      return memberExpression(node, source);
    case 'ObjectExpression':
      const obj: { [key: string]: any } = {};
      node.properties.forEach(property => {
        const key =
          property.key.type === 'Identifier'
            ? property.key.name
            : walk(property.key, source);
        obj[key] = walk(property.value, source);
      });
      return obj;
    case 'FunctionExpression':
      const { start, end } = node as any;
      return source.slice(start - 1, end - 1);
    default:
      throw new Error();
  }
};

export const executeAST = (node: Node, source: string) => {
  if (node.type === 'Program') {
    if (node.body.length === 1 && node.body[0].type === 'ExpressionStatement') {
      return walk(node.body[0].expression, source);
    }
  }
  throw new Error('Invalid AST Found');
};
