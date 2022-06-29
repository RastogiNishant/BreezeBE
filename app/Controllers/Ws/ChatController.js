'use strict'

const BaseController = require('./BaseController')
//this should be coming from the database...
const origQuestions = [
  { id: 1, question: 'Hello There', type: 'not-a-question', next: 2 },
  {
    id: 2,
    question: 'What can I do for you?',
    type: 'multiple-choice-single-answer',
    choices: [
      { choice: 'Scratch Me', next_question: 3 },
      { choice: 'Lets chat', next_question: 5 },
      { choice: 'Not here', next_question: 8 },
      { choice: 'Lets stop', next_question: 10 },
    ],
  },
  {
    id: 3,
    question: 'Where do you want to be scratched?',
    type: 'multiple-choice-multiple-answer',
    next: 4,
    choices: [{ choice: 'head' }, { choice: 'back' }, { choice: 'front' }],
  },
  {
    id: 4,
    question: 'Scratching you... What else do you want?',
    type: 'multiple-choice-single-answer',
    choices: [
      { choice: 'Scratch Me', next_question: 3 },
      { choice: 'Lets chat', next_question: 5 },
      { choice: 'Not here', next_question: 8 },
      { choice: 'Lets stop', next_question: 10 },
    ],
  },
  {
    id: 5,
    question: 'What do you want to talk about?',
    type: 'multiple-choice-single-answer',
    choices: [
      { choice: 'Nothing', next_question: 6 },
      { choice: 'Anything', next_question: 6 },
      { choice: 'Everything', next_question: 6 },
    ],
  },
  {
    id: 6,
    question: 'Ok, you want to talk about %%prev_answers%%.',
    type: 'not-a-question',
    next: 7,
  },
  {
    id: 7,
    question: 'what else do you want?',
    type: 'multiple-choice-single-answer',
    choices: [
      { choice: 'Scratch Me', next_question: 3 },
      { choice: 'Lets chat', next_question: 5 },
      { choice: 'Not here', next_question: 8 },
      { choice: 'Lets stop', next_question: 10 },
    ],
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

class ChatController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
  }

  onAnswer({ question_id, answer, user }) {
    console.log('answer: ', question_id, answer, user)
    if (this.topic) {
      this.topic.broadcast('message', { message: answer, userId: this.auth.user.id })
      this.topic.broadcastToAll('question', this._nextQuestion(question_id, answer))
    }
  }

  onCreateTask() {
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
    console.log('craete task')
    if (this.topic) {
      //broadcast - not including sender
      //emitTo
      this.topic.broadcastToAll('question', qs)
    }
  }

  onMessage(message) {
    //save to db
    if (this.topic) {
      this.topic.broadcastToAll('message', { message, userId: this.auth.user.id })
    }
  }

  _nextQuestion(id, answer) {
    const questions = origQuestions
    const question = questions.find((question) => question.id == id)
    let next_question
    console.log({ id, answer, question })
    if (question.type == 'multiple-choice-single-answer') {
      const choice = question.choices.find((choice) => choice.choice == answer)
      if (choice) {
        next_question = questions.find((question) => question.id == choice.next_question)
        next_question.question.replace(/%%prev_answers%%/g, answer)
      } else {
        next_question = { question: `Wrong Answer. Please select from:`, choices: question.choices }
      }
    } else if (
      question.type == 'multiple-choice-multiple-answer' ||
      question.type == 'open-ended'
    ) {
      next_question = questions.find((dquestion) => dquestion.id == question.next)
      next_question.question = next_question.question.replace(/%%prev_answers%%/g, answer)
    } else if (question.type == 'not-a-question') {
      let doMore = true
      let qs = [next_question]
      while (doMore) {
        if (next_question.type !== 'not-a-question') {
          doMore = false
        }
        qs.push(next_question)
        next_question = questions.find((dquestion) => dquestion.id == next_question.next)
      }
      next_question = qs
    }
    return next_question
  }
}

module.exports = ChatController
