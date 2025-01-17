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

### Breeze Sprinting Guideline active from 21.11.2022:

1. Sprinting in Clickup is the only ONE task management tool for us (only tasks assigned to you via clickup are relevant for development, not slack on channels #dev-hub, #design-clarifications, nor #testing)
2. Slack is used only for our communication and task clarifications, but not for task assignments.
3. Before taking any task you have to assess its time completeness, incl. 20% buffer for error handlings.
4. If you take any task you have to start it by changing the tasks status to "In progress"
5. If you stop working on any task - to "On hold"
6. You can ONLY start any task immediately as soon as this task is assigned to you in the Sprint (only Clickup, no slack). Ask us (andrey) for help.
7. Any emergency task has to be added to Clickup first (not slack). Ask us (me) for help.
8. If the task is done in your view, you:
- cross-check your result against all acceptance criteria in the task
- go through key error handlings and fix them
- in github add to task name urgency word and add clickup link to the task
- send the working code to github (Dev env):
- change the task status to "PR raised backend"
9. After successful review the tech lead merges your changes to Staging env and changes task status from "PR raised backend" to "QA needed"
10. After successful test QA team changes the task status to "Staging tested" 
11. Tech Lead merges according to release list tasks from "Staging tested" to "Completed" (Released)
12. Not completed tasks in current Sprint have to be moved to next sprint or put to "On hold"
