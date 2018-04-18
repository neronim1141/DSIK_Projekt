'use strict';

const dgram = require('dgram');
const Game = require('./game');
const Commands = require('./commands');

let game;
let AI = false;
const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});
let PlayerName = Math.floor(Math.random() * 10 + 1);

const client = dgram.createSocket('udp4');
let players = [];

const main = async () => {
  let answer;
  answer = await question('AI player y/n?');
  if (answer === 'y') {
    AI = true;
  }
  answer = await question('playerName:');
  PlayerName = answer;

  client.send(
    Buffer.from(`${Commands.CONNECT} ${PlayerName}`),
    41234,
    'localhost',
    err => {}
  );
};

main();

//receive commands from server
client.on('message', (msg, rinfo) => {
  console.log(msg.toString());
  let command = msg.toString().split(' ');

  switch (command[0]) {
    case Commands.START:
      game = new Game(parseInt(command[1]));

      for (let x = 2; x < command.length; x++) {
        players.push(command[x]);
      }
      game.addPlayers(players);
      console.log(game.toBoard());
      break;
    case Commands.YOURTURN:
      makeMove();
      break;
    case Commands.MOVE:
      turnResolve(command[1], command[2], command[3]);
      break;
  }
});

// or Class
function AiMove() {
  return { x, y };
}

async function makeMove() {
  let x, y;
  if (AI) {
    do {
      let move = AiMove();
      x = move.x;
      y = move.y;
    } while (!game.canMove(PlayerName, x, y));

    client.send(
      Buffer.from(`${Commands.MOVE} ${PlayerName} ${x} ${y}`),
      41234,
      'localhost',
      err => {}
    );
  } else {
    let answer;

    do {
      answer = await question('yourmove x y?');
      let move = answer.split(' ');
      x = parseInt(move[0]);
      y = parseInt(move[1]);
    } while (!game.canMove(PlayerName, x, y));

    client.send(
      Buffer.from(`${Commands.MOVE} ${PlayerName} ${answer}`),
      41234,
      'localhost',
      err => {}
    );
  }
}
function turnResolve(name, x, y) {
  game.add(name, parseInt(x), parseInt(y));
  console.log(game.toBoard());
}

function question(question) {
  return new Promise((resolve, reject) => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}
