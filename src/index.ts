import { parse as parseAST } from 'acorn';
import { Node } from 'estree';

import { checkTree } from './check';
import { executeAST } from './eval';
import { Options, DefaultOptions } from './types';

function buildAST(input: string): Node {
  return parseAST(input, { ecmaVersion: 5 }) as Node;
}

export default function parse(
  input: string,
  options: Options = DefaultOptions
) {
  const wrapped = `(${input})`;
  const ast = buildAST(wrapped);
  if (checkTree(ast, options)) {
    return executeAST(ast);
  }
  return '';
}
