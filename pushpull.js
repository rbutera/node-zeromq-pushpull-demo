'use strict';
const zmq = require('zmq'), cluster = require('cluster');
const IPC_JOBS = 'ipc://pushpull-jobs.ipc', IPC_MESSAGES = 'ipc://pushpull-messages.ipc';

// spawn 3 worker processes
var spawnWorkers = function(){
  console.log('spawning worker processes');
  for (let i = 3; i > 0; i--) {
    cluster.fork();
  }
};

// create jobs
var jobs = 0;
var createJob = function(){
  jobs++;
  return JSON.stringify({jobId: jobs, details: "You're a badman, Rai.", timestamp: Date.now()});
};

// send out jobs
var sendJobs = function(pusher){
  if(!pusher){
    throw new Error('no pusher socket');
  } else {
    console.log('sending jobs out via push socket');
    for (var i = 0; i < 30; i++) {
      pusher.send(createJob());
    }
  }
};

// master/worker logic
var masterProcess = function(){
  var ready = 0;
  // create PUSH socket and bind to IPC endpoint
  let pusher = zmq.socket('push').bind(IPC_JOBS);
  // create PULL socket and bind to IPC endpoint
  let puller = zmq.socket('pull').bind(IPC_MESSAGES);

  // listen for messages on pull socket
  puller.on('message', function (data) {
    let parsed = JSON.parse(data.toString());
    if(!data){throw new Error('empty message sent to master');}
    if(!parsed || !parsed.type){
      throw new Error('master puller recieved message from worker with no type key');
    } else {
      if(parsed.type === 'ready'){
        ready++;
        console.log(parsed.worker + ' is ready');

        if(ready === 3){
          sendJobs(pusher);
        }
      } else if (parsed.type === 'result') {
        console.log(parsed);
      } else {
        throw new Error('master puller recieved message of unsupported type');
      }
    }
  });
  console.log('MASTER: listening for ready/result messages');

  // spin up workers
  spawnWorkers();
};

var workerProcess = function(){
  console.log('worker ' + process.pid + ' starting up');

  // create PULL socket and bind to master PUSH
  let incoming = zmq.socket('pull').connect(IPC_JOBS);
  // create PUSH socket and bind to master PULL
  let outgoing = zmq.socket('push').connect(IPC_MESSAGES);

  // listen to messages (ie. jobs) on pull socket
  incoming.on('message', function (data) {
    if (!data) {
      throw new Error('worker recieved message with no data');
    } else {
      console.log('worker recieved message');
      let job = JSON.parse(data.toString());
      let result = {type: 'result', workerId: process.pid, jobId: job.jobId, createdAt: job.timestamp, respondedAt: Date.now()};
      outgoing.send(JSON.stringify(result));
    }
  });

  // send a ready message out on PUSH socket
  outgoing.send(JSON.stringify({type: 'ready', worker: process.pid}));
};

// main logic
if (cluster.isMaster) {
  masterProcess();
} else {
  workerProcess();
}
