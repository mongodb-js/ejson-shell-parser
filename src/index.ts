import { parse as parseAST } from 'acorn';
import { Node } from 'estree';

import { checkTree } from './check';
import { executeAST } from './eval';
import { Options, buildOptions } from './options';

function buildAST(input: string): { ast: Node; hasComments: boolean } {
  let hasComments = false;

  const ast = parseAST(input, {
    ecmaVersion: 5,
    onComment: () => (hasComments = true),
  }) as Node;

  return {
    ast,
    hasComments,
  };
}

export default function parse(input: string, options?: Partial<Options>) {
  const parsedOptions = buildOptions(options);

  const { hasComments, ast } = buildAST(`(${input})`);

  const passedCommentsCheck = !hasComments || parsedOptions.allowComments;

  if (passedCommentsCheck && checkTree(ast, parsedOptions)) {
    return executeAST(ast);
  }
  return '';
}
