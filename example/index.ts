import {SeqQueue} from '../lib/SeqQueue';

let queue = new SeqQueue(1000);

queue.on('timeout', (task) => {
    console.log("监听超时事件：任务" + task.id + "超时");
});

queue.push((task) => {
    console.log("任务1");
    task.done();
});
queue.push((task) => {
    console.log("任务2");
    task.done();
});

queue.push(
    (task) => {
        setTimeout(() => {
            //8s后才执行task.done(),超时了
            console.log("8s后任务3才执行task.done(),超时了");
            task.done();
        }, 8000);
    },
    () => {
        console.log("任务3超时---回调");
    }
);

queue.push(
    (task) => {
        setTimeout(() => {
            console.log("任务4");
            task.done();
        }, 3000);
    },
    () => {
        console.log("任务4超时---回调");
    },
    5000
);

queue.push(() => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log("任务5-Promise");
            resolve();
        }, 500);
    });
});

queue.push((task) => {
    console.log("任务6");
    task.done();
});