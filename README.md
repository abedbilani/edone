<!-- Prepared By: Mohammad Kahil-->

<p  align="center">
<a  href="http://nestjs.com/"  target="blank"><img  src="https://nestjs.com/img/logo-small.svg"  width="200" height="200" alt="Nest Logo"  /></a>
<a  href="https://zeroandone.me/"  target="blank"><img  src="https://zeroandone.me/svg/logo.svg"  width="200" height="200" alt="ZeroandOne Logo"  /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<p  align="center">A clean and maintainable boilerplate template, built with a progressive <a  href="http://nodejs.org"  target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>

<p  align="center">

<a  href="https://www.npmjs.com/~nestjscore"  target="_blank"><img  src="https://img.shields.io/npm/v/@nestjs/core.svg"  alt="NPM Version"  /></a>

<a  href="https://twitter.com/nestframework"  target="_blank"><img  src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>

</p> // TODO

## Template Description

This is a clean architecture starter template for NestJS projects that adheres
to [SOLID](https://en.wikipedia.org/wiki/SOLID) Principles popularized
by [Robert C. Martin](https://en.wikipedia.org/wiki/Robert_C._Martin) (in as much as it is efficient in our use case)
and the official supported [NestJS architecture](https://docs.nestjs.com/).

## Features

-   Node v18.18.0 // TODO
-   [Prettier](https://github.com/prettier/prettier) Formatting Before Commit
    with [Husky](https://github.com/typicode/husky)
-   [ESLint](https://github.com/eslint/eslint) linting Before Commit with Husky
-   Monitoring and
    enforcing [conventional git commit message structure](https://medium.com/rupesh-tiwari/conventional-git-commit-messages-and-linting-76e1fbb9e14a#:~:text=Conventional%20Commit%20Message%20Format&text=The%20commit%20message%20should%20be,as%20in%20various%20git%20tools.)
    with [commitlint](https://github.com/conventional-changelog/commitlint)

## Dependancies


## File Structure

```
.
├── .github/
│   └── workflows
```



## Edit Pre-Commit Checks

To edit pre-commit checks simply edit .husky/pre-commit which should look something like:

```bash
#!/usr/bin/env sh

.  "$(dirname  -- "$0")/_/husky.sh"

npm  test
npx  lint-staged
```

To edit git commit messages criteria edit commitlintrc.json which should look like:

```json
{
    "extends": ["@commitlint/config-conventional"],
    "rules": {
        "type-enum": [
            2,
            "always",
            ["ci", "chore", "docs", "ticket", "feat", "fix", "perf", "refactor", "revert", "style"]
        ]
    }
}
```

## License

This template is [MIT licensed](https://github.com/git/git-scm.com/blob/main/MIT-LICENSE.txt).
