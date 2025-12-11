import { GlobalRegistrator } from '@happy-dom/global-registrator';

// 注册 Happy DOM 全局环境 (模拟浏览器 window, document 等)
GlobalRegistrator.register();

// Mock IndexedDB
const mockIDB = {
    open: () => ({
        result: {},
        addEventListener: () => { },
        removeEventListener: () => { },
        onsuccess: () => { },
        onerror: () => { },
    }),
};
// @ts-expect-error -- GlobalRegistrator types partial match
global.indexedDB = mockIDB;
// @ts-expect-error -- window types partial match
window.indexedDB = mockIDB;
