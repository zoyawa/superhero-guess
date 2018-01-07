/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/

'use strict';

const Alexa = require('alexa-sdk');

const APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

const FACTS = [
  {
    'name': 'Spiderman',
    'fact': 'He became super-human after he was bit by a spider.',
    'level': 1
  },
  {
    'name': 'Spiderman',
    'fact': 'His name is Peter Parker.',
    'level': 2
  },
  {
    'name': 'Superman',
    'fact': 'He can fly.',
    'level': 1
  },
  {
    'name': 'Superman',
    'fact': 'He wears red and blue clothes.',
    'level': 1
  },
  {
    'name': 'Superman',
    'fact': 'He can fire laser with his eyes.',
    'level': 2
  },
  {
    'name': 'Superman',
    'fact': 'He wears his underwear over his pants.',
    'level': 3
  }
];

let isMatchingNames = function(a, b) {
  return a.toUpperCase() === b.toUpperCase();
}

let allFacts = function (level, name) {
  if (!level && !name) {
    return FACTS;
  }

  let facts = FACTS.filter(function(fact) {
    let levelMatch = level ? level === fact.level : true;
    let nameMatch = name ? isMatchingNames(name, fact.name) : true;
    
    return levelMatch && nameMatch; 
  });
  
  return facts;
};

let allSuperheros = function(facts) {
  let mapSuperheros = {};

  facts.forEach(function(fact) {
    mapSuperheros[fact.name] = undefined;
  });

  return Object.keys(mapSuperheros);
}

let maxLevel = function(level, name) {
  let max = 1;
  FACTS.forEach(function(fact) {
    if (fact.level > max) {
      max = fact.level;
    }  
  });
  
  return max;
};

let getRandomFact = function(facts) {
  let idx = Math.floor(Math.random() * facts.length);
  let _facts = facts.splice(idx, 1);
  return _facts[0];
};

let checkAnswer = function(fact, answer) {
  return isMatchingNames(fact.name, answer);
}

const ABOUT = 'Welcome to Superhero Guess Alexa Skill. \
The game skill tells a fact and you have to guess for which superhero or villain, this fact is true.';
const HELP = ABOUT;
const GOODBYE = 'Thanks for playing Superhero Guess. Goodbye!';
const PROMPT_ASK_NEXTFACT = "Ask me give me a fact to guess by saying: next fact."
const PROMPT_ASK_ANSWER = "Who do you think he/she is?";
const UNKNOWN_ERROR = "Someting went wrong.";

const handlers = {
  'LaunchRequest': function () {
    this.attributes['level'] = 1;
    this.attributes['facts'] = allFacts(this.attributes['level']);
    this.attributes['score'] = 0;

    this.response.speak(ABOUT).listen(PROMPT_ASK_NEXTFACT);
    this.emit(':responseReady');
  },
  'NextFactIntent': function () {
    this.attributes['question'] = getRandomFact(this.attributes['facts']);
    if (!this.attributes['question']) {
      this.attributes['level'] = ++ this.attributes['level'];
    }

    this.response.speak(this.attributes['question'].fact).listen(PROMPT_ASK_ANSWER);
    this.emit(':responseReady');
  },
  'AnswerIntent': function () {
    const answer = this.event.request.intent.slots.Answer.value;
    if (checkAnswer(this.attributes['question'], answer)) {
      this.attributes['score'] = ++ this.attributes['score'];
      delete this.attributes['question'];
      this.response.speak(answer + ' is correct answer.').listen(PROMPT_ASK_NEXTFACT);
    } else {
      this.response.speak(answer + ' is incorrect answer.').listen(PROMPT_ASK_ANSWER);
    }
    this.emit(':responseReady');
  },
  'RepeatFactIntent': function () {
    const question = this.attributes['question'];
    if (question) {
      this.response.speak(question.fact).listen(PROMPT_ASK_ANSWER);
    } else {
      this.response.listen(PROMPT_ASK_NEXTFACT);
    }

    this.emit(':responseReady');
  },  
  'CheckLevelIntent': function () {
    const prompt = this.attributes['question'] ? PROMPT_ASK_ANSWER : PROMPT_ASK_NEXTFACT;
    this.response.speak('You are at level: ' + this.attributes['level'] + ' in this game.').listen(prompt);
    this.emit(':responseReady');
  },
  'CheckScoreIntent': function () {
    const prompt = this.attributes['question'] ? PROMPT_ASK_ANSWER : PROMPT_ASK_NEXTFACT;
    this.response.speak('Your score is ' + this.attributes['score'] + ' in this game.').listen(prompt);
    this.emit(':responseReady');
  },
  'WhichSuperherosIntent': function () {
    let names = allSuperheros(this.attributes['facts']);
    this.response.speak('At this current level: ' + this.attributes['level'] + ', possible correct superheros are from list: ' + names.join(', ')).listen(PROMPT_ASK_ANSWER);
    this.emit(':responseReady');
  },
  'AMAZON.HelpIntent': function () {
    const prompt = this.attributes['question'] ? PROMPT_ASK_ANSWER : PROMPT_ASK_NEXTFACT;
    this.response.speak(HELP).listen(prompt);
    this.emit(':responseReady');
  },
  'AMAZON.CancelIntent': function () {
    this.response.speak(GOODBYE);
    this.emit(':responseReady');
  },
  'AMAZON.StopIntent': function () {
    this.response.speak(GOODBYE);
    this.emit(':responseReady');
  },
  "Unhandled": function() {
    this.response.speak(UNKNOWN_ERROR).listen(PROMPT_ASK_NEXTFACT);
    this.emit(':responseReady');
  }
};

exports.handler = function (event, context) {
  const alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};
