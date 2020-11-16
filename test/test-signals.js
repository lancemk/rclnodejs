'use strict';

const assert = require('assert');
const rclnodejs = require('..');
const childProcess = require('child_process');

if (process.env['RCLNODEJS_TEST_FORK']) {
  let context = process.argv[2] === '--non-default-context' ? new rclnodejs.Context() : undefined;

  rclnodejs
    .init(context)
    .then(() => {
      const node = rclnodejs.createNode('test_pub', undefined, context);
      const publisher = node.createPublisher('std_msgs/msg/String', 'test');
      node.createTimer(100, () => {
        publisher.publish({ data: 'hello' });
      });
      rclnodejs.spin(node);
    })
    .catch(() => {
      process.exit(1);
    });
} else {
  let child;

  beforeEach(async () => {
    await rclnodejs.init();
  });

  afterEach(() => {
    child.kill('SIGKILL');
    rclnodejs.shutdown();
  });

  it('gracefully shuts downs on SIGINT when only running default context', async () => {
    child = childProcess.fork(__filename, {
      env: { ...process.env, RCLNODEJS_TEST_FORK: true },
    });
    const node = rclnodejs.createNode('test_sub');
    node.createSubscription('std_msgs/msg/String', 'test', () => {
      if (!child.killed) {
        child.kill('SIGINT');
      }
    });
    rclnodejs.spin(node);
    await new Promise((res) => {
      child.on('close', (exitCode) => {
        assert.strictEqual(exitCode, 0);
        res();
      });
    });
  });

  it('gracefully shuts downs on SIGINT when running non-default context', async () => {
    child = childProcess.fork(__filename, ['--non-default-context'], {
      env: { ...process.env, RCLNODEJS_TEST_FORK: true },
    });
    const node = rclnodejs.createNode('test_sub');
    node.createSubscription('std_msgs/msg/String', 'test', () => {
      if (!child.killed) {
        child.kill('SIGINT');
      }
    });
    rclnodejs.spin(node);
    await new Promise((res) => {
      child.on('close', (exitCode) => {
        assert.strictEqual(exitCode, 0);
        res();
      });
    });
  });
}