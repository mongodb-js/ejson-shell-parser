import { Expression, UnaryExpression, BinaryExpression, Identifier, Node, ObjectExpression, MemberExpression, CallExpression, NewExpression } from "estree";
import { getScopeFunction, getMemberProperty } from "./scope";

const unaryExpression = (node: UnaryExpression): any => {
  if (!node.prefix) throw new Error('Malformed UnaryExpression');
  switch (node.operator) {
    case "-": return (-walk(node.argument));
    case "+": return (+walk(node.argument));
    case "!": return (!walk(node.argument));
    case "~": return (~walk(node.argument));
    default: throw new Error(`Invalid UnaryExpression Provided: '${node.operator}'`)
  }
}

const binaryExpression = (node: BinaryExpression): any => {
  const { left, right } = node;
  switch(node.operator) {
    case "==": return walk(left) == walk(right);
    case "!=": return walk(left) != walk(right);
    case "===": return walk(left) === walk(right);
    case "!==": return walk(left) !== walk(right);
    case "<": return walk(left) < walk(right);
    case "<=": return walk(left) <= walk(right);
    case ">": return walk(left) > walk(right);
    case ">=": return walk(left) >= walk(right);
    case "<<": return walk(left) << walk(right);
    case ">>": return walk(left) >> walk(right);
    case ">>>": return walk(left) >>> walk(right);
    case "+": return walk(left) + walk(right);
    case "-": return walk(left) - walk(right);
    case "*": return walk(left) * walk(right);
    case "/": return walk(left) / walk(right);
    case "%": return walk(left) % walk(right);
    case "**": return walk(left) ** walk(right);
    case "|": return walk(left) | walk(right);
    case "^": return walk(left) ^ walk(right);
    case "&": return walk(left) & walk(right);
    case "in": return walk(left) in walk(right);
    case "instanceof": return walk(left) instanceof walk(right);
  }
}

const memberExpression = (node: CallExpression | NewExpression): any => {
  switch (node.callee.type) {
    case 'Identifier':
      // Handing <Constructor>() and new <Constructor>() cases
      const callee = getScopeFunction((node.callee).name) as Function;
        const args = node.arguments.map(arg => walk(arg as Expression)) as any[];
        return node.type === 'NewExpression' ? new (callee as any)(...args) : callee.apply(callee, args)
      case 'MemberExpression':
        // If they're using a static method on a member
        if (node.callee.object.type === "Identifier") {
        const property = (node.callee.property as Identifier).name;
        const fn = getMemberProperty((node.callee.object.name), property);
        const args = node.arguments.map(arg => walk(arg as Expression)) as any[];
        return fn.apply(fn, args);
      } else if (node.callee.property.type === "Identifier") {
        const obj = walk(node.callee.object as Expression);
        const property = node.callee.property.name;
        const args = node.arguments.map(arg => walk(arg as Expression)) as any[];
        return obj[property].apply(obj, args);
      }
      default:
        throw new Error('Should not evaluate invalid expressions');
  }
};

const walk = (node: Expression): any => {
  switch (node.type) {
    case 'Literal': return node.value;
    case 'UnaryExpression': return unaryExpression(node);
    case 'BinaryExpression': return binaryExpression(node);
    case 'ArrayExpression': return node.elements.map(node => walk(node as Expression))
    case "CallExpression":
    case "NewExpression":
      return memberExpression(node);
    case "ObjectExpression":
      const obj: { [key: string]: any } = {};
      node.properties.forEach(property => {
        const key = property.key.type === 'Identifier' ? property.key.name : walk(property.key);
        obj[key] = walk(property.value as Expression);
      })
      return obj
    default:
      throw new Error();
  }
}

export const executeAST = (node: Node) => {
  if (node.type === 'Program') {
    if (node.body.length === 1 && node.body[0].type === 'ExpressionStatement') {
      return walk(node.body[0].expression);
    }
  }
  throw new Error("Invalid AST Found");
}
