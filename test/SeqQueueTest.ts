import test from 'ava';
import { SeqQueue } from '../lib/SeqQueue';

/**队列已关闭事件 */
const EVENT_CLOSED = 'closed';
/**任务处理完事件 */
const EVENT_DRAINED = 'drained';
/**任务超时事件 */
const EVENT_TIMEOUT = 'timeout';
/**任务处理出错事件 */
const EVENT_ERROR = 'error';

test('超时时间小于0', t => {
  let q = new SeqQueue();
  t.throws(() => { q.push((task) => { task.done(); }, () => { }, -1000) }, Error);

  t.throws(() => { new SeqQueue(-1000) }, Error);
});

test('添加任务到队列', t => {
  let q = new SeqQueue();
  t.true(q.push((task) => { task.done() }));
  t.true(q.push((task) => { task.done() }, () => { }));
  t.true(q.push((task) => { task.done() }, () => { }, 1000));
});

test('任务按进队列的顺序执行', t => {
  let q = new SeqQueue();
  let res = [];
  q.push((task) => {
    res.push(1);
    task.done();
  });
  q.push((task) => {
    res.push(2);
    task.done();
  });
  q.push((task) => {
    res.push(3);
    task.done();
  });
  q.push((task) => {
    res.push(4);
    task.done();
  });

  q.push((task) => {
    t.deepEqual(res, [1, 2, 3, 4]);
    task.done();
  });
});

test('队列关闭', t => {
  let q = new SeqQueue();
  let res = [];
  q.push((task) => {
    res.push(1);
    task.done();
  });
  q.push((task) => {
    res.push(2);
    task.done();
  });
  q.push((task) => {
    setTimeout(() => {
      res.push(3);
      task.done();
    }, 2000);
  });

  q.push((task) => {
    t.deepEqual(res, [1, 2, 3]);
    task.done();
  });

  q.close();
});

test('强制关闭队列', t => {
  let q = new SeqQueue();
  let res = [];
  q.push((task) => {
    res.push(1);
    task.done();
  });
  q.push((task) => {
    res.push(2);
    task.done();
  });
  q.push((task) => {
    setTimeout(() => {
      res.push(3);
      task.done();
    }, 2000);
  });

  q.push((task) => {
    t.deepEqual(res, [1, 2]);
    task.done();
  });

  q.close(true);
});

test('队列关闭后不能添加任务', t => {
  let q = new SeqQueue();
  q.push((task) => {
    task.done();
  });
  q.push((task) => {
    task.done();
  });

  q.close(true);
  t.false(q.push((task) => { task.done() }));
});

test('任务超时', t => {
  let q = new SeqQueue();
  q.push((task) => {
    task.done();
  });
  q.push((task) => {
    setTimeout(() => {
      task.done();
    }, 5000);
  });
  q.on(EVENT_TIMEOUT, (task) => {
    t.is(task.id, 2);
  });
});