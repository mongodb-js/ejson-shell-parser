import { parse as parseAST } from 'acorn';
import { Node } from 'estree';

import { checkTree } from './check';
import { executeAST } from './eval';

function buildAST(input: string): Node {
  return parseAST(input, { ecmaVersion: 5 }) as Node;
}

interface Options {
  weakParsing: boolean;
}

export default function parse(input: string) {
  const wrapped = `(${input})`;
  const ast = buildAST(wrapped);
  if (checkTree(ast)) {
    return executeAST(ast);
  }
  return '';
}
