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

const ABOUT = 'Welcome to playing Superhero Guess. \
It is an Alexa game skill, which asks facts about superheros and you guess who they are.';
const HELP = ABOUT;
const GAME_OVER = 'Well done, you have finshed the game.';
const GOODBYE = 'Thanks for playing Superhero Guess. Goodbye!';
const PROMPT_ASK_NEXTFACT = "Say \'Next Fact\' to begin."
const PROMPT_ASK_ANSWER = "Who do you think he or she is?";
const UNKNOWN_ERROR = "Something went wrong.";

const handlers = {
  'LaunchRequest': function () {
    this.attributes['level'] = 1;
    this.attributes['facts'] = allFacts(this.attributes['level']);
    this.attributes['score'] = 0;
    delete this.attributes['question'];

    //this.response.speak(ABOUT + ' ' + PROMPT_ASK_NEXTFACT);
    this.emit(':ask', ABOUT + ' ' + PROMPT_ASK_NEXTFACT);
  },
  'NextFactIntent': function (prefix) {
    let message = prefix ? prefix + '. The next fact is: ' : '';
    
    if (this.attributes['question']) {
      this.emit('RepeatFactIntent');
      return;
    }
    
    let facts = this.attributes['facts'];
    let level = this.attributes['level'];

    if (facts.length === 0) {
      facts = this.attributes['facts'] = allFacts(++level);
      this.attributes['level'] = level;
    }
    const question = getRandomFact(facts);
    if (question) {
      this.attributes['question'] = question;
      this.response.speak(message + question.fact).listen(PROMPT_ASK_ANSWER);
    } else {
      if (level > maxLevel()) {
        this.response.speak(GAME_OVER).listen(GOODBYE);
      }
    }

    this.emit(':responseReady');
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
    console.log('$$$$" ' + answer);
    
    
    if (!answer) {
      this.emit('Unhandled');
      return;
    }
    
    if (checkAnswer(this.attributes['question'], answer)) {
      this.attributes['score'] = ++ this.attributes['score'];
      delete this.attributes['question'];
      //this.response.speak(answer + ' is correct answer.').listen(PROMPT_ASK_NEXTFACT);
      this.emit('NextFactIntent', answer + ' is correct answer.');
    } else {
      this.response.speak(answer + ' is incorrect answer.').listen(PROMPT_ASK_ANSWER);
      this.emit(':responseReady');
    }
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
  'GiveClueIntent': function () {
    let names = allSuperheros(this.attributes['facts'].concat(this.attributes['question']));
    this.response.speak('You have to pick one superhero from the list containing: ' + names.join(', ')).listen(PROMPT_ASK_ANSWER);
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
