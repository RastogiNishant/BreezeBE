# Code Quality Guidelines

With this merge we have completed the setup of husky and some simple pre-commit hooks. This will ensure code formatting and typescript validation before code is commited into any branch. In case you receive git commit issue warnings in your IDE please run `npm run pre-commit` to check the issues that are causing the git commit issue in a better format. (If this command succeeds the commit will also succeed.)

## Ongoing Refactor efforts

### Implementation of typescript

We have currently typescript setup in a minimal setup. Currently only applying to `server.ts` and will extend in a certain path to enable a step by step approach, not breaking our current code. Next steps are to move the `routes.js` to typescript and refactor the route definition into smaller pieces. So that at the end all endpoints are reflected in a folder structure that is easily mapped to route definitions. After that we can move controllers and services into typesript as well.

### Framework lock-in

Currently we are locked into adonisjs and rely on many functions of the framework, we do need to migrate to newer versions of the framework or move to another framework, therefore we do want to reduce the framework dependencies we do have.

### NodeJS legacy code

We do need to complete the upgrade to NodeJS v18 and thereafter get rid of legacy code, that is not required any longer. This includes the removal of packages e.g. `node-fetch`.
