'use strict'

const origQuestions = [
  {
    id: 1,
    question: `Hello There, I'm here to assist you on your concern.`,
    type: 'not-a-question',
    next: 2,
  },
  {
    id: 2,
    question: 'What is the nature of this problem?',
    type: 'multiple-choice-single-answer',
    choices: [
      { choice: 'Heating', next_question: 3 },
      { choice: 'Window', next_question: 5 },
      { choice: 'Toilet', next_question: 8 },
      { choice: 'Water tap', next_question: 10 },
      { choice: 'Electricity', next_question: 10 },
      { choice: 'Door', next_question: 10 },
      { choice: 'Unit', next_question: 10 },
      { choice: 'Bath/Shower', next_question: 10 },
      { choice: 'Entrance', next_question: 10 },
      { choice: 'Outside', next_question: 10 },
      { choice: 'Kitchen', next_question: 10 },
    ],
  },
  {
    id: 3,
    question: 'What happened with the heating?',
    type: 'multiple-choice-multiple-answer',
    next: 4,
    choices: [{ choice: 'No heating' }, { choice: 'Water Flows' }, { choice: 'Broken' }],
  },
  {
    id: 4,
    question: 'Where did this happen?',
    type: 'multiple-choice-single-answer',
    next: 5,
    choices: [
      { choice: 'Kitchen' },
      { choice: 'Bathroom' },
      { choice: 'Living Room' },
      { choice: 'Dining Area' },
    ],
  },
  {
    id: 5,
    question: 'How urgent is this concern?',
    type: 'multiple-choice-single-answer',
    choices: [
      { choice: 'Not Urgent', next_question: 6 },
      { choice: 'A little Urgent', next_question: 6 },
      { choice: 'Urgent', next_question: 6 },
      { choice: 'Very Urgent', next_question: 6 },
    ],
  },
  {
    id: 6,
    question:
      'Kindly describe the nature of this problem/concern. You can add pictures if you want.',
    type: 'open-ended',
    next: 7,
  },
  {
    id: 7,
    question:
      'Thank you for reporting this concern/problem. We will take note of this and inform the landlord. He will PROBABLY contact you later.',
    type: 'final',
  },
  {
    id: 8,
    question: 'So, what do you want?',
    type: 'open-ended',
    next: 9,
  },
  {
    id: 9,
    question:
      "Hmmm... so you want: %%prev_answers%%. I'll give you: %%prev_answers%%. What else do you want?",
    type: 'multiple-choice-single-answer',
    choices: [
      { choice: 'Scratch Me', next_question: 3 },
      { choice: 'Lets chat', next_question: 5 },
      { choice: 'Not here', next_question: 8 },
      { choice: 'I think thats all.', next_question: 10 },
    ],
  },
  {
    id: 10,
    question: "Thank you... you're great. Hope to be of service again.",
    type: 'final',
  },
]

const BaseController = require('./BaseController')

class TaskController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth, channel: 'task' })
  }

  //this is not needed anymore...
  onTaskInit() {
    let count = 0
    let doMore = true
    let qs = []
    do {
      if (origQuestions[count].type !== 'not-a-question') {
        doMore = false
      }
      qs.push(origQuestions[count])
      count++
    } while (doMore)
    this.broadcast(qs, 'question', 0)
  }

  onMessage(message) {
    super.onMessage(message)
  }
}

module.exports = TaskController
