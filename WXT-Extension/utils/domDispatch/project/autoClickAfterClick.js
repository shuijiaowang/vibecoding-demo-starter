//辅助函数，sleep
const sleep = (ms) => new Promise(r => setTimeout(r, ms + Math.random() * 50));

// 总入口
//元素，事件类型，参数配置
async function nativeTrigger(el, type, options = {}) {
    switch (type) {
        case 'click':
            return nativeClick({ el, options });
        case 'input':
            return nativeInput({ el, options });
        case 'keyboard':
            return nativeKeyboard({ el, options });
        case 'slide': // 新增滑动事件
            return nativeSlide({ el, options });
        default:
            console.warn('Unknown event type');
    }
}
// 内部具体实现
async function nativeClick(opt) {
    const {el, options} = opt;
    options.count = options.count ?? 1;// 当 undefined 或 null 时才用 1
    //获取坐标
    let rect = null;
    let x = 0;
    let y = 0;
    // 【修改1：统一获取「实际要点击的目标元素」】
    //但这里本质上还是定位到这个元素，这应该交给外层需求来进行判断或寻找？
    let targetEl = el;
    if (el === document) { //如果无法确定元素，则传入坐标
        x = options.x ?? 0;
        y = options.y ?? 0;
        // 关键：根据坐标找到页面上实际的元素（这是点击生效的核心）
        targetEl = document.elementFromPoint(x, y);
        // 兜底：如果坐标无元素，用body（比document更易触发交互）
        if (!targetEl) targetEl = document.body;
    } else {
        rect = el.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
    }
    //点击次数
    for (let i = 0; i < options.count; i++) {
        // 【修改2：完善事件参数，模拟真实鼠标点击】
        const eventOpts = {
            bubbles: true,
            cancelable: true, // 必须加：允许事件被取消（模拟原生点击）
            clientX: x,
            clientY: y,
            button: 0, // 0=左键（核心：指定鼠标按键，默认可能无）
            pointerType: 'mouse' // PointerEvent需指定类型为鼠标
        };
        // 触发完整的指针事件流（改为触发到实际元素targetEl）
        targetEl.dispatchEvent(new PointerEvent('pointerdown', eventOpts));
        await sleep(10);
        targetEl.dispatchEvent(new PointerEvent('pointerup', eventOpts));
        await sleep(10);
        targetEl.dispatchEvent(new MouseEvent('click', eventOpts));
        await sleep(10);
        await sleep(options.sleeptime_single ?? 20);
        console.log("点击完成", i, x, y, "实际触发元素：", targetEl);
    }
}
function autoClickAfterClick(){
    //首先注入监听，按下ctrl+alt是，鼠标右键点击的坐标会按顺序被记录下来
    //然后写个定时任务，每十秒执行一次
    //均点击一次
    // 存储记录的右键点击坐标列表
    let recordedPositions = [];
// 定时任务实例（用于后续清除定时）
    let autoClickTimer = null;


    // 1. 监听鼠标右键点击（contextmenu），记录Ctrl+Alt按下时的坐标
    document.addEventListener('contextmenu', async (e) => {
        // 判断是否同时按下了Ctrl + Alt键
        if (e.ctrlKey && e.altKey) {
            // 阻止右键菜单弹出（提升体验）
            e.preventDefault();

            // 记录当前右键点击的坐标
            const position = { x: e.clientX, y: e.clientY };
            recordedPositions.push(position);

            console.log(`已记录坐标：X=${position.x}, Y=${position.y}\n当前共记录${recordedPositions.length}个坐标`);
        }
    });
    // 2. 启动定时任务：每10秒自动点击所有记录的坐标（各点击1次）
    if (autoClickTimer) {
        // 先清除已有定时（避免重复创建）
        clearInterval(autoClickTimer);
    }
// 每10秒执行一次（10000ms = 10秒）
    autoClickTimer = setInterval(async () => {
        console.log('===== 开始执行定时自动点击 =====');
        if (recordedPositions.length === 0) {
            console.log('暂无记录的坐标，跳过本次点击');
            return;
        }

        // 遍历所有记录的坐标，依次点击
        for (const pos of recordedPositions) {
            await nativeTrigger(document, 'click', {
                x: pos.x,
                y: pos.y,
                count: 1, // 每个坐标点击1次
                sleeptime_single: 50 // 坐标间间隔50ms，避免点击过快
            });
            await sleep(50); // 额外间隔，提升稳定性
        }
        console.log('===== 定时自动点击执行完成 =====');
    }, 1000*1);

    // 提示信息
    console.log('✅ 自动点击功能已启动：');
    console.log('   - 按下 Ctrl+Alt + 鼠标右键，可记录点击坐标');
    console.log('   - 每10秒会自动点击所有记录的坐标');
}

autoClickAfterClick()