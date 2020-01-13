import { Expression, UnaryExpression, BinaryExpression, Identifier, Node, ObjectExpression, MemberExpression } from "estree";
import { getScopeFunction, getMemberObject } from "./scope";

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

const walk = (node: Expression): any => {
  switch (node.type) {
    case 'Literal': return node.value;
    case 'UnaryExpression': return unaryExpression(node);
    case 'BinaryExpression': return binaryExpression(node);
    case 'ArrayExpression': return node.elements.map(node => walk(node as Expression))
    case "CallExpression":
    case "NewExpression":
      if (node.callee.type === "Identifier") {
        const callee = getScopeFunction((node.callee).name) as Function;
        const args = node.arguments.map(arg => walk(arg as Expression)) as any[];
        return node.type === 'NewExpression' ? new (callee as any)(...args) : callee.apply(callee, args)
      }
      else if (node.callee.type === "MemberExpression" && node.callee.object.type === "Identifier" && node.callee.property.type === "Identifier") {
        const object = getMemberObject((node.callee.object.name));
        const property = node.callee.property.name;
        const args = node.arguments.map(arg => walk(arg as Expression)) as any[];
        return (object[property]).apply(object[property], args);
      }
      throw new Error('Should not evaluate invalid expressions');
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
