

async function nativeClick(el) {

    let rect = el.getBoundingClientRect();
    let x = 0;
    let y = 0;

    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;

    // 【修改2：完善事件参数，模拟真实鼠标点击】
    const eventOpts = {
        bubbles: true,
        cancelable: true, // 必须加：允许事件被取消（模拟原生点击）
        clientX: x,
        clientY: y,
        button:0,//左键中键右键
        buttons: 1, // 补充buttons参数（更贴合原生事件） //如左键右键同时按下
        pointerType: 'mouse' // PointerEvent需指定类型为鼠标
    };
    el.dispatchEvent(new PointerEvent('pointerover', eventOpts));
    el.dispatchEvent(new PointerEvent('pointerenter', eventOpts));
    el.dispatchEvent(new PointerEvent('pointermove', eventOpts));
    // 触发完整的指针事件流（改为触发到实际元素targetEl）
    el.dispatchEvent(new PointerEvent('pointerdown', eventOpts));

    el.dispatchEvent(new PointerEvent('pointerup', eventOpts));

    el.dispatchEvent(new MouseEvent('click', eventOpts));//左键中键均为click事件

    console.log("点击完成", i, x, y, "实际触发元素：", el);
}

await nativeClick(document.querySelector("div.plr20 button"))