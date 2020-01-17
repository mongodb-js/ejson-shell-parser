import {
  UnaryExpression,
  BinaryExpression,
  Identifier,
  Node,
  CallExpression,
} from 'estree';
import { getScopeFunction, getMember } from './scope';

const unaryExpression = (node: UnaryExpression): any => {
  if (!node.prefix) throw new Error('Malformed UnaryExpression');
  switch (node.operator) {
    case '-':
      return -walk(node.argument);
    case '+':
      return +walk(node.argument);
    case '!':
      return !walk(node.argument);
    case '~':
      return ~walk(node.argument);
    default:
      throw new Error(`Invalid UnaryExpression Provided: '${node.operator}'`);
  }
};

const binaryExpression = (node: BinaryExpression): any => {
  const { left, right } = node;
  switch (node.operator) {
    case '==':
      return walk(left) == walk(right);
    case '!=':
      return walk(left) != walk(right);
    case '===':
      return walk(left) === walk(right);
    case '!==':
      return walk(left) !== walk(right);
    case '<':
      return walk(left) < walk(right);
    case '<=':
      return walk(left) <= walk(right);
    case '>':
      return walk(left) > walk(right);
    case '>=':
      return walk(left) >= walk(right);
    case '<<':
      return walk(left) << walk(right);
    case '>>':
      return walk(left) >> walk(right);
    case '>>>':
      return walk(left) >>> walk(right);
    case '+':
      return walk(left) + walk(right);
    case '-':
      return walk(left) - walk(right);
    case '*':
      return walk(left) * walk(right);
    case '/':
      return walk(left) / walk(right);
    case '%':
      return walk(left) % walk(right);
    case '**':
      return walk(left) ** walk(right);
    case '|':
      return walk(left) | walk(right);
    case '^':
      return walk(left) ^ walk(right);
    case '&':
      return walk(left) & walk(right);
    case 'in':
      return walk(left) in walk(right);
    case 'instanceof':
      return walk(left) instanceof walk(right);
    default:
      throw new Error(`Invalid BinaryExpression Provided: '${node.operator}'`);
  }
};

const memberExpression = (node: CallExpression): any => {
  switch (node.callee.type) {
    case 'Identifier': {
      // Handing <Constructor>() and new <Constructor>() cases
      const callee = getScopeFunction(node.callee.name);
      const args = node.arguments.map(arg => walk(arg));
      return node.type === 'NewExpression'
        ? new (callee as any)(...args)
        : callee.apply(callee, args);
    }
    case 'MemberExpression': {
      // If they're using a static method or a member
      const calleeThis =
        node.callee.object.type === 'Identifier'
          ? getMember(node.callee.object.name)
          : walk(node.callee.object);
      const calleeFn =
        node.callee.property.type === 'Identifier' && node.callee.property.name;

      if (!calleeFn)
        throw new Error('Expected CallExpression property to be an identifier');

      const args = node.arguments.map(arg => walk(arg));
      return calleeThis[calleeFn].apply(calleeThis, args);
    }
    default:
      throw new Error('Should not evaluate invalid expressions');
  }
};

const walk = (node: Node): any => {
  switch (node.type) {
    case 'Literal':
      return node.value;
    case 'UnaryExpression':
      return unaryExpression(node);
    case 'BinaryExpression':
      return binaryExpression(node);
    case 'ArrayExpression':
      return node.elements.map(node => walk(node));
    case 'CallExpression':
    case 'NewExpression':
      return memberExpression(node);
    case 'ObjectExpression':
      const obj: { [key: string]: any } = {};
      node.properties.forEach(property => {
        const key =
          property.key.type === 'Identifier'
            ? property.key.name
            : walk(property.key);
        obj[key] = walk(property.value);
      });
      return obj;
    default:
      throw new Error();
  }
};

export const executeAST = (node: Node) => {
  if (node.type === 'Program') {
    if (node.body.length === 1 && node.body[0].type === 'ExpressionStatement') {
      return walk(node.body[0].expression);
    }
  }
  throw new Error('Invalid AST Found');
};
