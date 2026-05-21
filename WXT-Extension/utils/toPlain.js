import { isRef, toRaw, unref } from 'vue'

/**
 * 去掉 Vue 响应式/ref 外壳，并深拷贝为纯对象/数组/JSON 基本类型，适合写入 extension storage 等场景。
 * 仅支持 JSON 可表达的数据；Date 会变成字符串，undefined / 函数 / Symbol / 循环引用不可用。
 */
export function toPlain(value) {
    let v = isRef(value) ? unref(value) : value
    if (v !== null && typeof v === 'object') {
        v = toRaw(v)
    }
    return JSON.parse(JSON.stringify(v))
}
