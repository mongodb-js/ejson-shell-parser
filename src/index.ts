import { parse as parseAST } from 'acorn';
import {
  Node,
  BaseCallExpression,
  Expression,
  SpreadElement,
  Pattern,
  Identifier,
} from 'estree';
import { GLOBAL_FUNCTIONS, ALLOWED_MEMBER_OBJECTS } from './scope';
import { executeAST } from './eval';

function buildAST(input: string): Node {
  return parseAST(input, { ecmaVersion: 5 }) as Node;
}

interface Options {
  weakParsing: boolean;
}

/**
 * Only allow CallExpressions where the Identifier matches a whitelist of safe
 * globals, and where the arguments are themselves safe expressions
 */
const checkSafeCall = (node: BaseCallExpression) => {
  if (node.callee.type === 'Identifier') {
    return (
      GLOBAL_FUNCTIONS.indexOf(node.callee.name) >= 0 &&
      node.arguments.every(checkSafeExpression)
    );
  } else if (node.callee.type === 'MemberExpression') {
    const expression = node.callee;
    // If we're only referring to identifiers, we don't need to check deeply.
    if (expression.object.type === 'Identifier') {
      return (
        ALLOWED_MEMBER_OBJECTS.indexOf(expression.object.name) >= 0 &&
        node.arguments.every(checkSafeExpression)
      );
    } else if (expression.object.type === 'NewExpression') {
      // TODO: Check if this prop actually exists on the object
      const object = expression.object.callee as Identifier;
      expression.object;
      return (
        ALLOWED_MEMBER_OBJECTS.indexOf(object.name) >= 0 &&
        node.arguments.every(checkSafeExpression)
      );
    } else {
      return (
        checkSafeExpression(expression.object as Expression) &&
        node.arguments.every(checkSafeExpression)
      );
    }
  }
  return false;
};

/**
 * Only allow an arbitrarily selected list of 'safe' expressions to be used as
 * part of a query
 */
const checkSafeExpression = (
  node: Expression | SpreadElement | Pattern
): boolean => {
  switch (node.type) {
    case 'Literal':
      return true;
    case 'ArrayExpression':
      return node.elements.every(checkSafeExpression);
    case 'UnaryExpression':
      // Note: this does allow using the `delete`, `typeof`, and `void` operators
      return checkSafeExpression(node.argument);
    case 'BinaryExpression':
      // Note: this does allow using the `instanceof`, `in`, and bitwise operators
      return checkSafeExpression(node.left) && checkSafeExpression(node.right);
    case 'CallExpression':
    case 'NewExpression':
      // allows both `new Date(...)` and `Date(...)` function calls
      return checkSafeCall(node);
    case 'ObjectExpression':
      return node.properties.every(property => {
        // don't allow computed values { [10 + 10]: ... }
        // don't allow method properties { start() {...} }
        if (property.computed || property.method) return false;
        // only allow literals { 10: ...} or identifiers { name: ... } as keys
        if (!['Literal', 'Identifier'].includes(property.key.type))
          return false;

        // object values can be any safe expression
        return checkSafeExpression(property.value);
      });
    default:
      return false;
  }
};

const checkTree = (node: Node, options: Options) => {
  if (node.type === 'Program') {
    if (node.body.length === 1 && node.body[0].type === 'ExpressionStatement') {
      return checkSafeExpression(node.body[0].expression);
    }
  }
  return false;
};

export default function parse(
  input: string,
  options: Options = { weakParsing: false }
) {
  const wrapped = `(${input})`;
  const ast = buildAST(wrapped);
  if (checkTree(ast, options)) {
    return executeAST(ast);
  }
  return '';
}
