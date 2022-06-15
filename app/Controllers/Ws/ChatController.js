'use strict'
const Ws = use('Ws')
//this should be coming from the database...
const questions = [
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
    question: 'Scratching you at your %%prev_answers%%. What else do you want?',
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
      { choice: 'I think thats all.', next_question: 10 },
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

class ChatController {
  constructor({ socket, request }) {
    this.socket = socket
    this.request = request
    this.topic = Ws.getChannel('chat:*').topic(this.socket.topic)
  }

  onAnswer(answer) {
    console.log('got answered', answer)
    this.socket.emit('question', this._nextQuestion(answer))
  }

  onCreateTask() {
    console.log('create task...')
    let count = 0
    let doMore = true
    do {
      if (questions[count].type !== 'not-a-question') {
        doMore = false
      }
      console.log(questions[count])
      this.topic.broadcast('question', questions[count])
      count++
    } while (doMore)
  }

  onMessage(message) {}

  _nextQuestion(answer) {}
}

module.exports = ChatController
