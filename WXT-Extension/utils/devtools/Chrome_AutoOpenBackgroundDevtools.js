// import {Browser as chrome} from "@wxt-dev/browser"; //错误，不能引入

export async function AutoOpenBackgroundDevtools() {
    console.log("【AutoOpenBackgroundDevtools】：打开service work devtool");

    // 1. 获取所有可用的调试目标
    const targets = await new Promise((resolve) => {
        chrome.debugger.getTargets((result) => {
            resolve(result);
        });
    });

    console.log("【AutoOpenBackgroundDevtools】：打印所有调试目标：", targets[0]);
    const extensionId = chrome.runtime.id;
    console.log("【AutoOpenBackgroundDevtools】：extensionId:", extensionId);

    // 2. 正确筛选目标
    const serviceWorkerTarget = targets.find((target) => {
        return (
            target.url.includes(extensionId) &&
            ['worker', 'service_worker'].includes(target.type)
        );
    });

    if (!serviceWorkerTarget) {
        console.log("【AutoOpenBackgroundDevtools】：未找到可用的Service Worker调试目标（可能已附加或不存在）");
        return;
    }

    console.log("【AutoOpenBackgroundDevtools】：筛选到的合法Service Worker目标：", serviceWorkerTarget);

    // 3. 构造合法的 Debuggee 参数
    const validDebuggee = {
        targetId: serviceWorkerTarget.id //只保留targetId参数
    };

    try {
        // 4. 附加调试器
        await new Promise((resolve, reject) => {
            chrome.debugger.attach(validDebuggee, "1.3", () => {
                if (chrome.runtime.lastError) {
                    if (chrome.runtime.lastError.message.includes("Already attached")) {
                        console.log("DevTools 已打开，无需重复附加调试器");
                        resolve(null);

                    } else {
                        reject(new Error(`附加调试器失败：${chrome.runtime.lastError.message}`));
                    }
                } else {
                    console.log("【AutoOpenBackgroundDevtools】：调试器已成功附加到 Service Worker");
                    resolve(null);
                }
            });
        });

        // 6. 显式创建 DevTools 窗口（核心新增步骤） //这是弹出来了一个新的标签页，现实的是js代码，点击f12的console是正确的。
        // await new Promise((resolve, reject) => {
        //     chrome.debugger.sendCommand(
        //         validDebuggee,
        //         "Target.createTarget",
        //         {
        //             url: serviceWorkerTarget.url,
        //             active: false, // 关键：不在前台激活，仅后台打开//没有用
        //
        //         },
        //         (result) => {
        //             if (chrome.runtime.lastError) {
        //                 reject(new Error(`创建 DevTools 窗口失败：${chrome.runtime.lastError.message}`));
        //             } else {
        //                 console.log("【AutoOpenBackgroundDevtools】：DevTools 窗口已显式创建并弹出");
        //                 resolve(result);
        //             }
        //         }
        //     );
        // });
        // 🔴 核心修改：用 chrome.tabs.create 后台打开标签页
        // await new Promise((resolve, reject) => {
        //     chrome.tabs.create({
        //         url: serviceWorkerTarget.url,
        //         active: false, // 关键：不在前台激活，仅后台打开
        //         selected:false //这俩都没有用
        //         // 可选：可添加 pinned: false 等其他配置
        //     }, (tab) => {
        //         if (chrome.runtime.lastError) {
        //             reject(new Error(`创建标签页失败：${chrome.runtime.lastError.message}`));
        //         } else {
        //             console.log("【AutoOpenBackgroundDevtools】：标签页已在后台创建，需手动点击查看");
        //             resolve(tab);
        //         }
        //     });
        // });

        // 🔴 恢复 CDP 命令创建 DevTools 目标，之后将其置为后台
        // 🔴 步骤1：先记录当前激活的标签页（兜底切回用）
        const currentActiveTab = await new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                resolve(tabs[0] || null);
            });
        });

        // 🔴 步骤2：恢复 CDP 命令创建 DevTools 目标
        const createResult = await new Promise((resolve, reject) => {
            chrome.debugger.sendCommand(
                validDebuggee,
                "Target.createTarget",
                { url: serviceWorkerTarget.url },
                (result) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(`创建 DevTools 窗口失败：${chrome.runtime.lastError.message}`));
                    } else {
                        resolve(result);
                    }
                }
            );
        });

        // 🔴 步骤3：增加延迟（300ms），确保 DevTools 窗口完全注册到 tabs 系统
        await new Promise(resolve => setTimeout(resolve, 500));

        // 🔴 步骤4：优化标签页匹配（同时匹配 url 和 pendingUrl，提高命中率）
        await new Promise((resolve) => {
            chrome.tabs.query({}, (allTabs) => { // 不限制 url，先获取所有标签页再筛选
                const devtoolTab = allTabs.find(tab =>
                    tab.url === serviceWorkerTarget.url || tab.pendingUrl === serviceWorkerTarget.url
                );

                if (devtoolTab) {
                    // 先尝试将 DevTools 窗口置为未激活
                    chrome.tabs.update(devtoolTab.id, { active: false }, () => {
                        console.log("【AutoOpenBackgroundDevtools】：尝试将 DevTools 窗口置为后台");
                        // 兜底：强制切回原本激活的标签页（核心确保不跳转）
                        if (currentActiveTab) {
                            chrome.tabs.update(currentActiveTab.id, { active: true }, () => {
                                console.log("【AutoOpenBackgroundDevtools】：已切回原标签页，DevTools 窗口保留在后台");
                                resolve(devtoolTab);
                            });
                        } else {
                            resolve(devtoolTab);
                        }
                    });
                } else {
                    // 若未找到，直接切回原标签页
                    if (currentActiveTab) {
                        chrome.tabs.update(currentActiveTab.id, { active: true }, () => {
                            console.log("【AutoOpenBackgroundDevtools】：DevTools 窗口创建成功，已切回原标签页");
                            resolve(null);
                        });
                    } else {
                        console.log("【AutoOpenBackgroundDevtools】：DevTools 窗口创建成功，未找到对应标签页且无原标签页可切回");
                        resolve(null);
                    }
                }
            });
        });


    } catch (error) {
        console.error("【AutoOpenBackgroundDevtools】：自动打开 DevTools 过程中出现异常：", error);
    }
}
export default AutoOpenBackgroundDevtools;