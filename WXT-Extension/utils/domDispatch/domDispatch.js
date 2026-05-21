//辅助函数，sleep
const sleep = (ms) => new Promise(r => setTimeout(r, ms + Math.random() * 50));

// 总入口
//元素，事件类型，参数配置
async function nativeTrigger(el, type, options = {}) {
    switch (type) {
        case 'click':
            return nativeClick({el, options});
        case 'input':
            return nativeInput({el, options});
        case 'keyboard':
            return nativeKeyboard({el, options});
        case 'slide': // 新增滑动事件
            return nativeSlide({el, options});
        default:
            console.warn('Unknown event type');
    }
}

// 内部具体实现
// 自动点击，
async function nativeClick(opt) {
    const {el, options} = opt;
    options.count = options.count ?? 1;// 当 undefined 或 null 时才用 1
    options.button = options.button ?? 0;// button参数，0=左键（默认），2=右键，1=中键
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
            button: options.button,//左键中键右键
            buttons: 1 << options.button, // 补充buttons参数（更贴合原生事件） //如左键右键同时按下
            pointerType: 'mouse' // PointerEvent需指定类型为鼠标
        };
        targetEl.dispatchEvent(new PointerEvent('pointerover', eventOpts));
        targetEl.dispatchEvent(new PointerEvent('pointerenter', eventOpts));
        targetEl.dispatchEvent(new PointerEvent('pointermove', eventOpts));
        // 触发完整的指针事件流（改为触发到实际元素targetEl）
        targetEl.dispatchEvent(new PointerEvent('pointerdown', eventOpts));

        await sleep(10);
        targetEl.dispatchEvent(new PointerEvent('pointerup', eventOpts));
        await sleep(10);
        // targetEl.dispatchEvent(new MouseEvent('click', eventOpts));
        if (options.button === 2) {
            targetEl.dispatchEvent(new MouseEvent('contextmenu', eventOpts));
        } else {
            targetEl.dispatchEvent(new MouseEvent('click', eventOpts));//左键中键均为click事件
        }
        await sleep(options.sleeptime_single ?? 20);
        console.log("点击完成", i, x, y, "实际触发元素：", targetEl);
    }
}

async function nativeInput(opt) {
    const {el, options} = opt;
    // 3. 模拟输入文字（兼容中英文，暴力破解框架拦截）
    // 3.1 保存原生的 value setter (用于绕过 React/Vue 的拦截)
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
    )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
    )?.set;

    // 3.2 模拟中文输入的 Composition 事件流 (更真实)
    el.dispatchEvent(new CompositionEvent('compositionstart', {bubbles: true}));
    await sleep(100);

    // 3.3 强制设置值
    const currentValue = el.value; // 获取输入框当前值
    nativeInputValueSetter.call(el, currentValue + options.input); // 拼接后赋值
    // nativeInputValueSetter.call(el, value.input);

    // 3.4 触发 compositionend 和 input 事件 (让框架感知到变化)
    el.dispatchEvent(new CompositionEvent('compositionupdate', {bubbles: true, data: options.input}));
    await sleep(50);
    el.dispatchEvent(new CompositionEvent('compositionend', {bubbles: true, data: options.input}));

    // 3.5 触发最原始的 input 事件
    el.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: options.input
    }));

    await sleep(300);
}

async function nativeKeyboard(opt) { /* ... */
}

// 新增：鼠标滑动（拖拽）功能
async function nativeSlide(opt) {
    const {el, options} = opt;
    // 必传参数：startX/startY（起始坐标）、endX/endY（结束坐标）
    const {
        startX = 0,
        startY = 0,
        endX = 0,
        endY = 0,
        duration = 300, // 滑动总时长（默认300ms，模拟真实滑动速度）
        steps = 20, // 滑动分步数（越多越平滑）
        button = 0 // 按下的按键（默认左键）
    } = options;

    // 1. 获取起始坐标的目标元素（滑动的起点元素）
    let targetEl = el;
    if (el === document) {
        targetEl = document.elementFromPoint(startX, startY) || document.body;
    }
    // 阻止右键菜单弹出的核心：取消contextmenu事件的默认行为
    const preventContextMenu = (e) => {
        e.preventDefault(); // 阻止默认右键菜单
        e.stopPropagation(); // 阻止事件冒泡
        e.stopImmediatePropagation(); // 阻止其他同类型监听器
        return false; // 兼容旧版浏览器
    };
    document.addEventListener('contextmenu', preventContextMenu, { capture: true, passive: false });
    targetEl.addEventListener('contextmenu', preventContextMenu, { capture: true, passive: false });

    try {
        // 2. 计算每一步的偏移量
        const stepX = (endX - startX) / steps;
        const stepY = (endY - startY) / steps;
        const stepDelay = duration / steps; // 每一步的间隔时间

        // 3. 第一步：按下鼠标（pointerdown）
        const downEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            clientX: startX,
            clientY: startY,
            button: button,
            buttons: 1 << button,
            pointerType: 'mouse'
        });
        downEvent.preventDefault();
        targetEl.dispatchEvent(downEvent);
        await sleep(10); // 按下后稍等

        // 4. 第二步：分步移动鼠标（pointermove），模拟平滑滑动
        for (let i = 1; i <= steps; i++) {
            const currentX = startX + stepX * i;
            const currentY = startY + stepY * i;

            const moveEvent = new PointerEvent('pointermove', {
                bubbles: true,
                cancelable: true,
                clientX: currentX,
                clientY: currentY,
                button: button,
                buttons: 1 << button, // 保持按键按下状态
                pointerType: 'mouse'
            });
            moveEvent.preventDefault(); // 移动时也阻止默认行为
            targetEl.dispatchEvent(moveEvent);
            await sleep(stepDelay); // 每步间隔
        }

        // 5. 第三步：松开鼠标（pointerup）
        const upEvent = new PointerEvent('pointerup', {
            bubbles: true,
            cancelable: true,
            clientX: endX,
            clientY: endY,
            button: button,
            buttons: 0, // 松开后无按键按下
            pointerType: 'mouse'
        });
        upEvent.preventDefault(); // 松开时阻止默认行为
        targetEl.dispatchEvent(upEvent);
        await sleep(10);

        console.log(`✅ 滑动完成：从(${startX}, ${startY}) → (${endX}, ${endY})，时长${duration}ms`);
        return {success: true, start: [startX, startY], end: [endX, endY]};
    } catch (error) {
        console.error('[滑动] 失败:', error);
        return {
            success: false, reason: error.message
        };
    } finally {
        // ========== 滑动完成后解绑阻止函数 ==========
        // 无论成功/失败，都要移除临时绑定的函数，避免影响后续操作
        // 立即移除（取消延迟，避免残留），并确保参数和绑定一致
        document.removeEventListener('contextmenu', preventContextMenu, { capture: true, passive: false });
        targetEl.removeEventListener('contextmenu', preventContextMenu, { capture: true, passive: false });
    }
}


// await nativeTrigger(document,'click',{x:100,y:805,button:0})
// 示例1：模拟从(100, 200)滑动到(500, 600)（左键，300ms平滑滑动）
await nativeTrigger(document, 'slide', {
    startX: 300,
    startY: 300,
    endX: 400,
    endY: 400,
    duration: 300,
    button: 2
});

//为什么右键，我用鼠标时松开后不会触发菜单，但是程序这里会触发右键菜单？
//测试，在普通网页，鼠标左键不能选中文本
//测试才绘图网页，左键可以显示框选，右键可以拖拽画布，但是右键结束后仍会触发右键菜单，修改后仍不行