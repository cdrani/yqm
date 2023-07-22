function setBadgeInfo(active = true) {
    chrome.action.setBadgeText({ text: !!active ? 'on' : 'off' })
    chrome.action.setBadgeBackgroundColor({ color: !!active ? '#b3000f': '#707070' })
}

async function getActiveTab() {
    const result = await chrome.tabs.query({ 
        active: true, 
        currentWindow: true,
        url: ['*://*.youtube.com/*'],
    })

    return result?.at(0)
}

async function sendMessage({ message }) {
    const activeTab = await getActiveTab()
    if (!activeTab) return

    return await messenger({ tabId: activeTab.id, message })
}

async function registerScripts() {
    await chrome.scripting.registerContentScripts([{
        id: 'script-content',
        js: ['content-script.js'],
        runAt: 'document_idle',
        matches: ['*://*.youtube.com/*']
    }])
}


chrome.runtime.onInstalled.addListener(async () => {
    await registerScripts()
    const result = await setState({ 
        key: 'state',
        value : { active: true,  event: 'onInstalled' }
    })

    if (!result?.error) setBadgeInfo(true)
})

function stateResolver({ resolve, reject, result, key }) {
    if (chrome.runtime.lastError) {
        console.error('Error: ', chrome.runtime.lastError)
        return reject({ error: chrome.runtime.lastError })
    } 
    return key ? resolve(result[key]) : resolve()
}

function getState({ key = 'state' }) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (result) => {
            return stateResolver({ key, resolve, reject, result })
        })
    })    
}

function setState({ key = 'state', value = {} }) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, (result) => {
            return stateResolver({ resolve, reject, result })
        })
    })
}

function messenger({ tabId, message }) {
    return new Promise((reject, resolve) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
                return reject({ error: chrome.runtime.lastError })
            } 
            return resolve(response)
        })
    })
}

chrome.storage.onChanged.addListener(async changes => {
    const { newValue } = changes.state
    setBadgeInfo(newValue.active)
    await sendMessage({ message: newValue })
})

chrome.tabs.onActivated.addListener(async () => {
    const state = await getState({ key: 'state' })
    await sendMessage({ message: { active: state.active, event: 'onActivated' } })
})

chrome.action.onClicked.addListener(async () => {
    const state = await getState({ key: 'state' })
    await setState({ 
        key: 'state', 
        value: { active: !state.active, event: 'onClicked' } 
    })
})

chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
    if (tab.active && changeInfo?.status === 'complete') {
        const state = await getState({ key: 'state' })
        sendMessage({ message: { active: state.active, event: 'onUpdated' } })
    }
})
