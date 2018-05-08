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
      break;

    case Commands.YOURTURN:
      makeMove();
      break;
    // if anyone (and you) made move
    case Commands.MOVE:
      turnResolve(command[1], command[2], command[3]);
      break;
    case Commands.LOSE:
      console.log(Commands.LOSE);
      break;
    case Commands.WIN:
      console.log(Commands.WIN);
      break;
    case Commands.DISCONNECTED:
      console.log(Commands.DISCONNECTED);
      client.close();
      process.exit();
      break;
  }
});

// or Class return moves by ai
function AiMove() {
  //starting input for player 2
  let x = 4,
    y = 0;
  let possiblemoves = [];
  for (let y = 0; y < game.map_.length; y++) {
    for (let x = 0; x < game.map_.length; x++) {
      if (game.map_[y][x].playerName == PlayerName) {
        possiblemoves.push({
          x,
          y
        });
      }
    }
  }

  return possiblemoves[Math.floor(Math.random() * (possiblemoves.length - 1))];
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
  if (PlayerName != name) console.log('got Move:', name, x, y);
  else console.log('your Move:', name, x, y);
  displayBoard();
}

function question(question) {
  return new Promise((resolve, reject) => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}
function displayBoard() {
  let yrows = '\x1b[47m\x1b[30m  ';
  for (let i = 0; i < game.map_.length; i++) yrows += i + ' ';
  yrows += '\x1b[0m';
  console.log(yrows);

  for (let y = 0; y < game.map_.length; y++) {
    let row = '';
    for (let x = 0; x < game.map_.length; x++) {
      if (x == 0) row += '\x1b[47m\x1b[30m' + y + ' \x1b[0m';
      if (game.map_[y][x].playerName == null) {
        row += '\x1b[37m' + game.map_[y][x].points;
      } else if (game.map_[y][x].playerName == PlayerName) {
        row += '\x1b[32m' + game.map_[y][x].points;
      } else if (game.map_[y][x].playerName != null) {
        row += '\x1b[31m' + game.map_[y][x].points;
      }
      row += ' \x1b[0m';
    }
    console.log(row);
  }
  console.log();
}
