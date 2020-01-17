import {
  Node,
  BaseCallExpression,
  Expression,
  SpreadElement,
  Pattern,
  Identifier,
  NewExpression,
} from 'estree';

import { GLOBAL_FUNCTIONS, allowedMemberProp } from './scope';
import { Options } from './options';

class Checker {
  constructor(private options: Options) {}
  /**
   * Only allow CallExpressions where the Identifier matches a whitelist of safe
   * globals, and where the arguments are themselves safe expressions
   */
  checkSafeCall = (node: BaseCallExpression) => {
    const weakParsing = this.options.allowMembers;

    if (node.callee.type === 'Identifier') {
      return (
        GLOBAL_FUNCTIONS.indexOf(node.callee.name) >= 0 &&
        node.arguments.every(this.checkSafeExpression)
      );
    } else if (node.callee.type === 'MemberExpression' && weakParsing) {
      const object = node.callee.object;
      const property = node.callee.property as Identifier;
      // If we're only referring to identifiers, we don't need to check deeply.
      if (object.type === 'Identifier' && property.type === 'Identifier') {
        return (
          allowedMemberProp(object.name, property.name) &&
          node.arguments.every(this.checkSafeExpression)
        );
      } else if (
        object.type === 'NewExpression' ||
        object.type === 'CallExpression'
      ) {
        const callee = object.callee as Identifier;
        return (
          allowedMemberProp(callee.name, property.name) &&
          node.arguments.every(this.checkSafeExpression)
        );
      } else {
        return (
          this.checkSafeExpression(object as Expression) &&
          node.arguments.every(this.checkSafeExpression)
        );
      }
    }
    return false;
  };

  /**
   * Only allow an arbitrarily selected list of 'safe' expressions to be used as
   * part of a query
   */
  checkSafeExpression = (
    node: Expression | SpreadElement | Pattern
  ): boolean => {
    switch (node.type) {
      case 'Literal':
        return true;
      case 'ArrayExpression':
        return node.elements.every(this.checkSafeExpression);
      case 'UnaryExpression':
        // Note: this does allow using the `delete`, `typeof`, and `void` operators
        return this.checkSafeExpression(node.argument);
      case 'BinaryExpression':
        // Note: this does allow using the `instanceof`, `in`, and bitwise operators
        return (
          this.checkSafeExpression(node.left) &&
          this.checkSafeExpression(node.right)
        );
      case 'CallExpression':
      case 'NewExpression':
        // allows both `new Date(...)` and `Date(...)` function calls
        return this.checkSafeCall(node);
      case 'ObjectExpression':
        return node.properties.every(property => {
          // don't allow computed values { [10 + 10]: ... }
          // don't allow method properties { start() {...} }
          if (property.computed || property.method) return false;
          // only allow literals { 10: ...} or identifiers { name: ... } as keys
          if (!['Literal', 'Identifier'].includes(property.key.type))
            return false;

          // object values can be any safe expression
          return this.checkSafeExpression(property.value);
        });
      default:
        return false;
    }
  };
}

export const checkTree = (node: Node, options: Options) => {
  if (node.type === 'Program') {
    if (node.body.length === 1 && node.body[0].type === 'ExpressionStatement') {
      const checker = new Checker(options);
      return checker.checkSafeExpression(node.body[0].expression);
    }
  }
  return false;
};
