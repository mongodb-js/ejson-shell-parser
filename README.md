# ejson-shell-parser

**Currently not published to NPM**

Parses valid MongoDB EJSON Shell queries.
This library does not validate that these queries are correct. It's focus is on parsing untrusted input. You may wish to use something like https://github.com/mongodb-js/mongodb-language-model to achieve this.

This library creates an AST from the proposed input, and then traverses this AST to check if it looks like a valid MongoDB query. If it does, the library will then evaluate the code to produce the parsed query.

This library supports two different modes to evaluate an AST-validated query.

**eval**: [default] Once we have validated that the query is 'safe', we simply run eval over the original input string.
```
import parse from 'ejson-shell-parser';

const query = parse('{ _id: ObjectID("132323") }');
```

**evalAST**: An experimental option to manually eval the AST, which should be safer than using `eval` directly
```
import parse from 'ejson-shell-parser';

const query = parse('{ _id: ObjectID("132323") }', { evalUsingTree: true });
```

