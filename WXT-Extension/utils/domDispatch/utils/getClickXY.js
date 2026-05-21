// const handleClick = (e) => {
//     // 计算并整理不同维度的坐标（满足不同场景需求）
//     const coords = {
//         // 🔥 最常用：相对于浏览器可视区域（不含滚动距离）
//         视口坐标: { x: e.clientX, y: e.clientY },
//         // 相对于整个文档（含滚动距离，适合长页面）
//         文档坐标: { x: e.pageX, y: e.pageY },
//         // 相对于电脑屏幕（物理屏幕位置）
//         屏幕坐标: { x: e.screenX, y: e.screenY },
//         // 相对于点击的元素本身（元素内部的相对位置）
//         元素内坐标: { x: e.offsetX, y: e.offsetY },
//         // 点击的目标元素（方便定位点击的DOM）
//         点击元素: e.target
//     };
//
//     // 格式化打印，清晰易读
//     console.log('==== 鼠标点击坐标信息 ====');
//     for (const [key, value] of Object.entries(coords)) {
//         if (key !== '点击元素') {
//             console.log(`${key}: x = ${value.x}, y = ${value.y}`);
//         } else {
//             console.log(`${key}:`, value);
//         }
//     }
//     e.bubbles
//     console.log('------------------------\n');
// };
// document.addEventListener('click', handleClick);

// mousePosition.js (鼠标坐标处理模块)

/**
 * 获取鼠标点击坐标的核心方法
 * @param {MouseEvent} e - 鼠标点击事件对象
 * @returns {Object} 包含多种坐标信息的对象
 */
export const getMouseClickPosition = (e) => {
    // 封装所有有用的坐标信息
    const position = {
        // 相对于浏览器视口的坐标 (常用)
        client: {
            x: e.clientX,
            y: e.clientY
        },
        // 相对于整个文档的坐标 (包含滚动距离)
        page: {
            x: e.pageX,
            y: e.pageY
        },
        // 相对于屏幕的坐标
        screen: {
            x: e.screenX,
            y: e.screenY
        },
        // 相对于点击元素的坐标
        offset: {
            x: e.offsetX,
            y: e.offsetY
        }
    };

    // 格式化打印，清晰易读
    console.log('==== 鼠标点击坐标信息 ====');
    for (const [key, value] of Object.entries(position)) {
        console.log(`${key}坐标: x = ${value.x}, y = ${value.y}`);
    }
    console.log('------------------------\n');

    // 返回坐标对象（核心：导出/返回坐标）
    return position;
};

/**
 * 初始化鼠标点击监听的方法
 * @returns {Function} 返回移除监听的方法（方便手动取消监听）
 */
export const initMouseClickListener = () => {
    // 定义点击事件处理函数
    const handleClick = (e) => {
        // 调用核心方法获取坐标
        const mousePosition = getMouseClickPosition(e);
        // 这里可扩展自定义逻辑，比如传递坐标到其他业务函数
    };

    // 绑定点击事件
    document.addEventListener('click', handleClick);

    // 返回移除监听的方法，方便后续取消
    return () => {
        document.removeEventListener('click', handleClick);
    };
};
