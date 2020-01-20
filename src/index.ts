import { parse as parseAST } from 'acorn';
import { Node } from 'estree';

import { checkTree } from './check';
import { executeAST } from './eval';
import { Options, buildOptions } from './options';

function buildAST(input: string, onComment: any): Node {
  return parseAST(input, { ecmaVersion: 5, onComment }) as Node;
}

export default function parse(input: string, options?: Options) {
  const wrapped = `(${input})`;

  let hasComments = false;
  const ast = buildAST(wrapped, () => (hasComments = true));

  const passedCommentsCheck = !hasComments || options?.allowComments;

  if (passedCommentsCheck && checkTree(ast, buildOptions(options))) {
    return executeAST(ast);
  }
  return '';
}
