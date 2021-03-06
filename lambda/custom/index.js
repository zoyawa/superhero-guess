/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/

'use strict';

const Alexa = require('alexa-sdk');
const FACTS = require('./facts.json');

const APP_ID = 'amzn1.ask.skill.4347353f-5bbe-4b1f-8b38-33f82ca4620b';

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

let maxLevel = function() {
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

const ABOUT = 'Welcome to playing Superhero Guess.';
const HELP = 'Here, Alexa tells you a superhero fact, and you guess which superhero the fact is about.';
const GAME_OVER = 'Well done, you have finshed the game.';
const GOODBYE = 'Thanks for playing Superhero Guess. Goodbye!';
const PROMPT_ASK_NEXTFACT = "Say \'Next Fact\' to begin."
const PROMPT_ASK_ANSWER = "Which superhero do you think the fact is about?";
const UNKNOWN_ERROR = "Something went wrong.";

const handlers = {
  'LaunchRequest': function () {
    this.attributes['level'] = 1;
    this.attributes['facts'] = allFacts(this.attributes['level']);
    this.attributes['score'] = 0;
    delete this.attributes['question'];

    this.emit(':ask', ABOUT + ' ' + HELP + ' ' + PROMPT_ASK_NEXTFACT);
  },

  'NextFactIntent': function (prefix) {
    let message = prefix ? prefix : '';
    
    if (this.attributes['question']) {
      this.emit('RepeatFactIntent');
      return;
    }
    
    let facts = this.attributes['facts'];
    let level = this.attributes['level'];

    if (facts.length === 0) {
      facts = this.attributes['facts'] = allFacts(++level);
      this.attributes['level'] = level;
      if (level <= maxLevel()) {
        message += '. Your current score is: ' + this.attributes['score'] + '. Now you are playing at level: ' + level;
      }
    }
    
    if (prefix) {
      message += '. The next fact is: ';
    }
    
    const question = getRandomFact(facts);
    if (question) {
      this.attributes['question'] = question;
      this.emit(':ask', message + question.fact + ' ' + PROMPT_ASK_ANSWER);
    } else {
      if (level > maxLevel()) {
        this.emit(':tell', GAME_OVER + ' ' + GOODBYE);
      }
    }
  },

  'AnswerIntent': function () {
    const firstName = this.event.request.intent.slots.FirstName.value;
    const lastName = this.event.request.intent.slots.LastName.value;
    let answer = '';
    if (firstName) {
      answer = firstName;
    }
    if (lastName) {
      answer += ' ' + lastName;
    }
    
    if (!answer) {
      this.emit('Unhandled');
      return;
    }

    if (checkAnswer(this.attributes['question'], answer)) {
      this.attributes['score'] = ++ this.attributes['score'];
      delete this.attributes['question'];
      this.emit('NextFactIntent', 'Great, ' + answer + ' is correct.');
    } else {
      this.emit(':ask', 'Oops, ' + answer + ' is incorrect. ' + PROMPT_ASK_ANSWER);
    }
  },

  'RepeatFactIntent': function () {
    const question = this.attributes['question'];
    if (question) {
      this.emit(':ask', question.fact + ' ' + PROMPT_ASK_ANSWER);
    } else {
      this.emit('NextFactIntent');
    }
  },  

  'CheckLevelIntent': function () {
    const prompt = this.attributes['question'] ? PROMPT_ASK_ANSWER : PROMPT_ASK_NEXTFACT;
    this.emit(':ask', 'You are at level: ' + this.attributes['level'] + ' in this game. ' + prompt);
  },

  'CheckScoreIntent': function () {
    const prompt = this.attributes['question'] ? PROMPT_ASK_ANSWER : PROMPT_ASK_NEXTFACT;
    this.emit(':ask', 'Your score is ' + this.attributes['score'] + ' in this game. ' + prompt);
  },

  'GiveClueIntent': function () {
    let facts = [];

    if (this.attributes['question']) {
      facts = facts.concat(this.attributes['question']);
    }

    if (facts.length === 0) {
      this.emit(':ask', 'To being please ' + PROMPT_ASK_NEXTFACT);
      return;
    }

    if (this.attributes['facts']) {
      facts = facts.concat(this.attributes['facts']);
    }

    let names = allSuperheros(facts);
    this.emit(':ask', 'The answer could be any of these: ' + names.join(', ') + '. ' + PROMPT_ASK_ANSWER);
  },

  'AMAZON.HelpIntent': function () {
    let message = HELP;
    const question = this.attributes['question'];
    if (question) {
      message += ' The current fact is: ' + question.fact + ' ' + PROMPT_ASK_ANSWER;
    } else {
      message += ' ' + PROMPT_ASK_NEXTFACT;
    }
    this.emit(':ask', message);
  },

  'AMAZON.CancelIntent': function () {
    this.emit(':tell', GOODBYE);
    this.emit(':responseReady');
  },

  'AMAZON.StopIntent': function () {
    this.emit(':tell', GOODBYE);
  },

  "Unhandled": function() {
    const prompt = this.attributes['question'] ? PROMPT_ASK_ANSWER : PROMPT_ASK_NEXTFACT;
    this.emit(':ask', UNKNOWN_ERROR + ' ' + prompt);
  }
};

exports.handler = function (event, context) {
  const alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  alexa.registerHandlers(handlers);
  alexa.execute();
};
