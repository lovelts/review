if (typeof window === 'undefined' || typeof MessageChannel !== 'function') {
    // 非浏览器环境，或不支持 MessageChannel，会使用 setTimeout 宏任务来实现
} else {
    // 保存 api 引用，防止 polyfill 覆盖它们
    const setTimeout = window.setTimeout;
    const clearTimeout = window.clearTimeout;

    getCurrentTime = () => performance.now(); // 页面加载后开始计算

    let isMessageLoopRunning = false; // 标记 MessageChannel 正在运行
    let scheduledHostCallback = null; // 要执行的处理函数
    let taskTimeoutID = -1; // 用作终止 setTimeout 延迟任务

    // 定义每一帧工作时间，默认时间为 5ms，React 会根据浏览器主机环境进行重新计算。
    let yieldInterval = 5;
    let deadline = 0; // 过期时间，让出主线程

    // 让出主线程
    shouldYieldToHost = function () {
        return getCurrentTime() >= deadline;
    };

    // 开启高频短间隔 5ms 执行工作
    const performWorkUntilDeadline = () => {
        if (scheduledHostCallback !== null) {
            const currentTime = getCurrentTime(); // 拿到当前时间
            // 根据 yieldInterval（5ms）计算剩余时间（任务执行截止时间）。这种方式意味着 port.postMessage 开始后总有剩余时间
            deadline = currentTime + yieldInterval;
            // 标识还有时间，类似 requestIdleCallback deadline.didTimeout
            const hasTimeRemaining = true;
            try {
                const hasMoreWork = scheduledHostCallback(
                    hasTimeRemaining,
                    currentTime,
                );
                // 执行完成，没有新任务，初始化工作环境
                if (!hasMoreWork) {
                    isMessageLoopRunning = false;
                    scheduledHostCallback = null;
                } else {
                    // 如果任务截止时间过期（根据 shouldYieldToHost()），还有需要处理的工作，再发起一个异步宏任务
                    port.postMessage(null);
                }
            } catch (error) {
                port.postMessage(null);
                throw error;
            }
        } else {
            isMessageLoopRunning = false;
        }
    };


    // 定义宏任务，建立通信
    const channel = new MessageChannel();
    const port = channel.port2; // 用于发布任务
    channel.port1.onmessage = performWorkUntilDeadline; // 处理任务

    requestHostCallback = function (callback) {
        scheduledHostCallback = callback; // 保存任务
        if (!isMessageLoopRunning) {
            isMessageLoopRunning = true;
            port.postMessage(null); // 发起宏任务
        }
    };  

}
let workIndex = 0;
let taskTotal = 5000; // 任务数量
const start = Date.now();
function handleWork() {
    for (let j = 0; j < 4000; j++) {
        // DOM 操作严重影响程序执行效率
        const btn1Attr = document.getElementById('btn1').attributes;
        const btn2Attr = document.getElementById('btn2').attributes;
        const btn3Attr = document.getElementById('btn1').attributes;
        const btn4Attr = document.getElementById('btn2').attributes;
    }
    workIndex++;
    if (workIndex >= taskTotal) {
        // console.log(`任务调度完成，用时：`, Date.now() - start, 'ms!');
    }
}

// while (workIndex < taskTotal) {
//   handleWork();
// }

function workLoop() {
    // 执行 shouldYieldToHost 来判断本次宏任务的 高频（短间隔）5ms 时间切片是否用尽
    while (!shouldYieldToHost() && workIndex < taskTotal) {
        handleWork();
    }
    if (workIndex < taskTotal) {
        console.log(`开启下一个宏任务继续执行剩余任务`);
        return true;
    } else {
        return false;
    }
}

requestHostCallback(workLoop);

document.getElementById('btn1').onclick = function () {
    console.log(11111, 'click')
}