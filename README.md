# Breeze Notes to Backend Developers

These are notes to setup your local.

## Prerequisites

You need to have your node version to >=14.0.0 and to have the following applications setupped before moving further:

1. Postgis (postgres with postgis) - for the database
2. Redis - caching

### Setting up using Docker

If you use docker you can go through these notes.

#### Setting up Postgis

```bash
docker run --name postgis -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgis/postgis
```

When the container is upped, you need to create the database on the postgres and enable the postgis extension container with:

```bash
> psql -U postgres
postgres=# CREATE DATABASE breeze;
postgres=# \c breeze;
postgres=# CREATE EXTENSION postgis;
```

To verify whether postgis extension is enabled:

```bash
postgres=# \dx
```

#### Setting up Redis

```bash
docker run --name redis -p 6379:6379 -d redis
```

Once you have both postgis and redis running, you can now proceed with cloning the backend to your local.

## First time setup

#### Clone this repository to your local

After cloning, create your local copy of the env file by running one of the following command.

```bash
npm run setup-env:dev
```

this will setup the local to the dev environment. Update values for the key DB_PASSWORD to the one you used to setup postgis.

#### Install Dependencies

Install the node packages:

```bash
npm install
```

make sure you have the `@adonisjs/cli` package installed. I recommend you install it globally with

```bash
npm install -g @adonisjs/cli
```

Test adonisjs by

```bash
adonis --version
```

#### Migrations

Run the following command to run startup migrations.

```bash
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

We have a swagger documentation (currently under development) which could guide you.

```/docs```
