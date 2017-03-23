SeqQueue - keep task to be executed in order
=====================================================

##Example
``` ts
import { SeqQueue } from 'SeqQueue';

let queue = new SeqQueue(1000);
queue.push((task) => {
    console.log("hello world, one.");
    task.done();
});
queue.push((task) => {
    console.log("hello world, two.");
    task.done();
});

queue.push(
    (task) => {
        setTimeout(() => {
            console.log("hello world, three. timeout");
            task.done();
        }, 3000);
    },
    () => {
        console.log("three timeout");
    }
);

queue.push(
    (task) => {
        setTimeout(() => {
            console.log("hello world, four. No timeout");
            task.done();
        }, 3000);
    },
    () => {
        console.log("timeout");
    },
    5000
);
``` 
###Res
hello world, one.
hello world, two.
three timeout
hello world, three. timeout
hello world, four. No timeout

##API
###new SeqQueue(timeout:number=3000)
Create a SeqQueue instance.

###SeqQueue.push(func: (task: { done: () => boolean }) => void, onTimeoutFunc?: () => void, timeout?: number): boolean
Add a task into the queue.

###queue.close(force:boolean=false)
Close the queue.
####Arguments
+ force - If true, queue would stop working immediately and ignore any tasks left in queue. Otherwise queue would execute the tasks in queue and then stop.

##Event
SeqQueue instances extend the EventEmitter and would emit events in their life cycles.
###'timeout'(totask)
If current task not invoke task.done() within the timeout ms, a timeout event would be emit. totask.fn and totask.timeout is the `fn` and `timeout` arguments that passed by `queue.push(2)`.
###'error'(err, task)
If the task function (not callbacks) throws an uncaught error, queue would emit an error event and passes the err and task informations by event callback arguments.
###'closed'
Emit when the close(false) is invoked.
###'drained'
Emit when close(true) is invoked or all tasks left have finished in closed status.
