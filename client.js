'use strict';

const dgram = require('dgram');
const Game = require('./game');
const Commands = require('./commands');
//initialize readline
const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});
const client = dgram.createSocket('udp4');

let game,
  AI = false,
  PlayerName,
  players = [];

const main = async () => {
  let answer;
  //wait for answer if Player is AI
  answer = await question('AI player y/n?');
  if (answer === 'y') {
    AI = true;
  }
  //wait for Player name
  answer = await question('playerName:');
  PlayerName = answer;

  // send connect message
  client.send(
    Buffer.from(`${Commands.CONNECT} ${PlayerName}`),
    41234,
    'localhost',
    err => {}
  );
};

//setup player and send message
main();

//receive commands from server
client.on('message', (msg, rinfo) => {
  console.log(msg.toString());
  let command = msg.toString().split(' ');

  switch (command[0]) {
    //game started
    case Commands.START:
      game = new Game(parseInt(command[1]));

      //get player names
      for (let x = 2; x < command.length; x++) {
        players.push(command[x]);
      }
      //add players to game
      game.addPlayers(players);
      //show board
      console.log(game.toBoard());
      break;

    case Commands.YOURTURN:
      makeMove();
      break;
    // if anyone (and you) made move
    case Commands.MOVE:
      turnResolve(command[1], command[2], command[3]);
      break;
  }
});

// or Class return moves by ai
function AiMove() {
  //starting input for player 2
  let x = 7,
    y = 0;
  return { x, y };
}

async function makeMove() {
  let x, y;
  if (AI) {
    do {
      //get ai move
      let move = AiMove();
      x = move.x;
      y = move.y;
      // while x and y are no good
    } while (!game.canMove(PlayerName, x, y));
  } else {
    let answer;

    do {
      //wait for player move
      answer = await question('yourmove x y?');
      let move = answer.split(' ');
      x = parseInt(move[0]);
      y = parseInt(move[1]);
      // while x and y are no good
    } while (!game.canMove(PlayerName, x, y));
  }
  //send move message
  client.send(
    Buffer.from(`${Commands.MOVE} ${PlayerName} ${x} ${y}`),
    41234,
    'localhost',
    err => {}
  );
}
function turnResolve(name, x, y) {
  // add move to board
  game.add(name, parseInt(x), parseInt(y));
  //show board
  console.log(game.toBoard());
}

function question(question) {
  return new Promise((resolve, reject) => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}
