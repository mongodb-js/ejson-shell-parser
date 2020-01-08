# ejson-shell-parser

**Currently not published to NPM**

Parses valid MongoDB EJSON Shell queries.
This library does not validate that these queries are correct. It's focus is on parsing untrusted input. You may wish to use something like https://github.com/mongodb-js/mongodb-language-model to achieve this.

There are two modes.

By default, it will validate that the query is safe to eval, and then eval it.
```
import parse from 'ejson-shell-parser';

const query = parse('{ _id: ObjectID("132323") }');
```

We also provide an experimental option to eval the AST, which should be safer than the default option.
```
import parse from 'ejson-shell-parser';

const query = parse('{ _id: ObjectID("132323") }', { evalUsingTree: true });
```

