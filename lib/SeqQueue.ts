import { EventEmitter } from 'events';

/**任务队列状态 */
enum STATUS {
    /**空闲 */
    IDLE = 1,
    /**忙碌 */
    BUSY = 2,
    /**关闭 */
    CLOSED = 3,
    /**处理完 */
    DRAINED = 4,
}

/**队列已关闭事件 */
const EVENT_CLOSED = 'closed';
/**任务处理完事件 */
const EVENT_DRAINED = 'drained';
/**任务超时事件 */
const EVENT_TIMEOUT = 'timeout';
/**任务处理出错事件 */
const EVENT_ERROR = 'error';

/**
 * 顺序任务队列
 * node.js是异步执行模型，所以任务的执行顺序并不能得到保证
 * SeqQueue使用队列的FIFO特性来保证任务的执行顺序
 * 且可以设定任务的超时时间及超时回调
 * 主要参考https://github.com/changchang/seq-queue.git
 */
export class SeqQueue extends EventEmitter {
    /**默认超时时间 */
    private timeout: number;
    /**当前执行任务id */
    private id: number;
    /**队列状态 */
    private status: STATUS;
    /**任务超时定时器 */
    private timer: NodeJS.Timer;
    /**任务队列数据 */
    private queue: { func: (task: { done: () => boolean }) => void, timeout: number, onTimeoutFunc?: () => void, id?: number; }[];

    constructor(timeout?: number) {
        super();
        if (timeout && timeout < 0) {
            throw new Error('timeout should be > 0.');
        }
        this.timeout = timeout || 3000;
        this.id = 1;
        this.status = STATUS.IDLE;
        this.queue = [];
    }

    /**
     * 执行任务
     * @param  {number} id
     */
    private exec(id: number) {
        if (this.id !== id || this.status !== STATUS.BUSY && this.status !== STATUS.CLOSED) {
            /**忽略无效的调用 */
            return;
        }
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }

        let task = this.queue.shift();
        if (!task) {
            if (this.status === STATUS.BUSY) {
                this.status = STATUS.IDLE;
                this.id++;
            } else {
                this.status = STATUS.DRAINED;
                this.emit(EVENT_DRAINED);
            }
            return;
        }
        task.id = ++this.id;
        let self = this;
        this.timer = setTimeout(() => {
            process.nextTick(() => {
                self.exec(task.id);
            });
            this.emit(EVENT_TIMEOUT, task);
            if (task.onTimeoutFunc) {
                task.onTimeoutFunc();
            }
        }, task.timeout);

        try {
            task.func({
                done: () => {
                    let res = task.id === self.id;
                    self.exec(task.id);
                    return res;
                }
            });
        } catch (error) {
            console.log('task exception: ' + error.message);
            this.emit(EVENT_ERROR, error, task);
            this.exec(this.id);
        }
    }

    /**
     * 添加任务
     * @param  {(task:{done:()=>boolean})=>void} func
     * @param  {()=>void} onTimeoutFunc?
     * @param  {number} timeout?
     * @returns boolean
     */
    push(func: (task: { done: () => boolean }) => void, onTimeoutFunc?: () => void, timeout?: number): boolean {
        if (this.status !== STATUS.IDLE && this.status !== STATUS.BUSY) {
            return false;
        }
        if (typeof func !== 'function') {
            throw new Error('func should be a function.');
        }
        if (timeout && timeout < 0) {
            throw new Error('timeout should be > 0.');
        }

        this.queue.push({ func: func, timeout: timeout || this.timeout, onTimeoutFunc: onTimeoutFunc });

        if (this.status === STATUS.IDLE) {
            this.status = STATUS.BUSY;
            process.nextTick(() => {
                this.exec(this.id);
            });
        }
        return true;
    }

    /**
     * 关闭任务队列
     * @param  {boolean=false} isForce
     */
    close(isForce: boolean = false) {
        if (this.status !== STATUS.IDLE && this.status !== STATUS.BUSY) {
            return;
        }
        if (isForce) {
            this.status = STATUS.DRAINED;
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = undefined;
            }
            this.emit(EVENT_DRAINED);
        } else {
            this.status = STATUS.CLOSED;
            this.emit(EVENT_CLOSED);
        }
    }
}