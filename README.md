# zeroMQ PUSH/PULL demonstration
## Introduction
- I'm working through Chapter 4 of [Node.js the Right Way](https://pragprog.com/book/jwnode/node-js-the-right-way)
- The final project is a program using `PUSH`/`PULL` sockets (`0MQ`) and Node.js clustering techniques.

## Task
- Spin up a pool of 3 workers and distribute 30 jobs between them (the whole program is likely to be less than 100 lines of code)

The **master process** should:

  + create a PUSH socket and bind it to an IPC endpoint - this socket will be for sending jobs to the workers
  + create a PULL socket and bind to a different IPC endpoint - this endpoint will receive messages from workers
  - Keep a count of ready workers (initialized to 0)
  - Listen for messages on the PULL socket, and
    + If the message is a `ready` message, increment the `ready` counter
    + If the message is a result message, output it to the console
  + Spin up three worker processes
  + When the `ready` counter reaches 3, send thirty `job` messages out through the `PUSH` socket


Each **worker process** should:
  - Create a PULL socket and connect it to the master's PUSH endpoint
  - Create a PUSH socket and connect it to the master's PULL endpoint
  - Listen for messages on the PULL socket, and
    + Treat this as a `job` and respond by sending a `result` message out on the `PUSH` socket
  + Send a `ready` message out on the `PUSH socket`

## Running
`npm install`
`node --harmony pushpull.js`
