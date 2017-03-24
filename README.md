SeqQueue - 保证任务的执行顺序
=====================================================

### Example
``` ts
import { SeqQueue } from 'SeqQueue';

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
``` 
### Result
+ 任务1
+ 任务2
+ 监听超时事件：任务3超时
+ 任务3超时---回调
+ 任务4
+ 8s后任务3才执行task.done(),超时了

### API
#### new SeqQueue(timeout:number=3000)
创建任务队列实例

#### SeqQueue.push(func, onTimeoutFunc?, timeout?): boolean
添加任务到队列
##### Arguments
+ func: : (task: { done: () => boolean }) => void;
+ onTimeoutFunc?: () => void;
+ timeout?: number;

#### queue.close(force:boolean=false)
关闭任务队列
##### Arguments
+ force默认为false,不会丢失队列中任务指定执行完任务才停止工作,如果为true,队列会立刻停止工作并丢失队列中剩下的任务. 

### Event
#### 'timeout'(task)
如果在设定的timeout时间内task.done()没有被调用,那么timeout事件就会被触发,执行onTimeoutFunc回调函数.
#### 'error'(err, task)
执行期间抛出异常,触发error事件
#### 'closed'
队列调用close(fale)触发
#### 'drained'
队列调用close(true)或所有任务都执行完毕队列自动状态改变为closed触发此事件
