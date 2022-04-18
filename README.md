#Breeze

## First time setup

create your local copy of the env file by running one of the following commands.

```bash
npm run setup-env:dev
```
```bash
npm run setup-env:staging
```
```bash
npm run setup-env:production
```

this will setup the local to the dev environment. use the relevant command



## Install

Use the adonis command to install the blueprint

```bash
npm run i
```

or manually clone the repo and then run `npm install`.

### Migrations

Run the following command to run startup migrations.

```js
adonis migration:run
```

#### Running Application

Run the app with:

```bash
adonis serve --dev
#or you can
npm run dev #this won't work with windows 10 because adding env variables is different there
```

If you're on windows 10 and you need to track database queries:

```bash
npm run dev:win10
```

### Code Reviews

Code review is the process of having one developer (or more) review another
developer's code before release.

Code reviews have two main goals:
	1. Improve the quality — of code before being released
	    Better quality translates into fewer failures and less maintenance down the line.
	2. Share knowledge — across the team
	    Sharing knowledge makes teams more resilient and engineers grow faster.

We have 2 checklists for code reviews. One is for before you create a pull request and the other one is for during code review.

Before we create a **Pull Request** we should be sure about:

- Is there any duplicated or unnecessary code?
- Did you check your changes one more time to prevent typos?
- Does each PR description reference a ClickUp ticket?
- Do your changes require explanation? If yes, did you explain them in the code or PR description?
- Did you replace all plain texts with translation keys?

We should follow these during code review:

- Is the code modular enough?
- Is the name of variables, functions, classes, and files self-explanatory?
- Does similar functionality already exist in the codebase? If so, why isn’t this functionality reused?
- Can you think of any use case where the code does not behave as intended?
- Can you think of any inputs, external events, or typos that could break the code?
- Can you see any plain texts not replaced with the translation key?

### Questions

Don't hesitate to ask questions from dev. Contact them via slack on the #dev-hub channel

### Documentations

---

Docs
---
```/docs```

