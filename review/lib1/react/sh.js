
let taskQueue = []

let isMessageLoopRunning = false; // 标记 MessageChannel 正在运行
let scheduledHostCallback = null; // 要执行的处理函数
let currentTask = null;
let startTime = null;

const localSetTimeout = typeof setTimeout === 'function' ? setTimeout : null;
const localClearTimeout =
    typeof clearTimeout === 'function' ? clearTimeout : null;
const localSetImmediate =
    typeof setImmediate !== 'undefined' ? setImmediate : null;
const getCurrentTime = () => performance.now();
function shouldYieldToHost() {
    const timeElapsed = getCurrentTime() - startTime;
    if (timeElapsed < 5) {
        return false;
    }
    return true;
}

function peek(heap) {
    return heap.length === 0 ? null : heap[0];
}
function Schedule(fiber) {
    performUnitOfWork(fiber)
}

function performUnitOfWork(callbcak) {
    let unitOfwork = {
        callbcak,
        expirationTime: performance.now() + 5,
    }
    taskQueue.push(unitOfwork)
    // console.log(performance.now() + 5, performance.now())
    requestHostCallback(workLoop)
}

const performWorkUntilDeadline = () => {
    if (scheduledHostCallback !== null) {
        const currentTime = getCurrentTime();
        startTime = currentTime;
        const hasTimeRemaining = true;

        let hasMoreWork = true;
        try {
            hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
        } finally {
            if (hasMoreWork) {
                schedulePerformWorkUntilDeadline();
            } else {
                isMessageLoopRunning = false;
                scheduledHostCallback = null;
            }
        }
    } else {
        isMessageLoopRunning = false;
    }
};

if (typeof localSetImmediate === 'function') {
    schedulePerformWorkUntilDeadline = () => {
        localSetImmediate(performWorkUntilDeadline);
    };
} else if (typeof MessageChannel !== 'undefined') {
    const channel = new MessageChannel();
    const port = channel.port2;
    channel.port1.onmessage = performWorkUntilDeadline;
    schedulePerformWorkUntilDeadline = () => {
        port.postMessage(null);
    };
} else {
    schedulePerformWorkUntilDeadline = () => {
        localSetTimeout(performWorkUntilDeadline, 0);
    };
}

function requestHostCallback(callback) {
    scheduledHostCallback = callback;
    if (!isMessageLoopRunning) {
        // 第一个进来开始 loop 
        isMessageLoopRunning = true;
        // 塞入微任务队列
        schedulePerformWorkUntilDeadline();
    }
}

function workLoop(hasTimeRemaining, initialTime) {
    let currentTime = initialTime;
    currentTask = peek(taskQueue);
    // console.log('workLoop', currentTask, currentTime, shouldYieldToHost())
    while (
        currentTask
    ) {
        // console.log('workLoop2', currentTask.expirationTime > currentTime,currentTime, shouldYieldToHost())

        if ((shouldYieldToHost() || !hasTimeRemaining)) {
        console.log(`开启下一个宏任务继续执行剩余任务`);
            // console.log('time', currentTask.expirationTime > currentTime, shouldYieldToHost())
            break
        } else {
            currentTask.callbcak()
            currentTask = taskQueue.shift()
            // currentTask = peek(taskQueue); 18 写法 包含小顶堆的算法
        }
    }
    if (currentTask !== null) {
        return true;
    } else {
        return false;
    }
}
let taskIndex = 0;
let taskTotal = 5000; // 任务数量
const start = Date.now();

function handleTask() {
    for (let j = 0; j < 5000; j++) {
        // 执行一些耗时操作
        const btn1Attr = document.getElementById('btn1').attributes;
        const btn2Attr = document.getElementById('btn2').attributes;
        const btn3Attr = document.getElementById('btn3').attributes;
    }
    if (taskIndex >= taskTotal) {
        // console.log(`任务调度    完成，用时：`, Date.now() - start, 'ms!');
    }
}

while (taskIndex <= taskTotal) {
    performUnitOfWork(handleTask)
    // handleTask() 
    taskIndex++
}

document.getElementById('btn1').onclick = function () {
    console.log(11111, 'click')
}
