class ObserverWrapper {
    constructor() {
        this._observer = undefined 
        this._selector = 'ytd-app'
        this._isHidden = true
        this._config = { childList: true, subtree: true } 
    }

    _composeObserver() {
        const composeBox = document.querySelector(this._selector)

        const mutationObserver = new MutationObserver(this._handleMutations)
        mutationObserver.observe(composeBox, this._config)

        this._observer = mutationObserver
    }

    _isMenuOption(mutation) {
        const { localName, innerText } = mutation.target
        return localName == 'yt-formatted-string' && innerText === 'Add to queue'
    }

    _isPlaylistIconHover(mutation) {
        const { target, addedNodes } = mutation
        return !!addedNodes?.length && target.id === 'hover-overlays' 
    }

    _isChildList(mutation) {
        return mutation.type === 'childList'
    }

    _filterMutations = (mutation) => {
        return this._isChildList(mutation) && 
                (this._isPlaylistIconHover(mutation) || this._isMenuOption(mutation))
    }

    _handleMutations = (mutationsList) => {
        const filteredList = mutationsList.filter(this._filterMutations)

        if (!filteredList?.length) return
        this._toggleQueueUI(filteredList)
    }

    _toggleQueueUI(mutationsList) {
        const display = this._isHidden ? 'none' : 'block'

        for (let mutation of mutationsList) {
            const { target, addedNodes } = mutation

            if (this._isPlaylistIconHover(mutation)) {
                const playlistIcon = Array.from(addedNodes)
                  .find(a => a.ariaLabel === 'Add to queue')
                playlistIcon?.setAttribute('style', `display: ${display}`)
            }

            if (this._isMenuOption(mutation)) {
                const element = target.parentElement.parentElement
                element?.setAttribute('style', `display: ${display}`)
            }
        }
    }

    hideUI() {
        this._isHidden = true
        if (!this._observer) { 
            this._composeObserver()
        }
    }

    showUI() {
        this._isHidden = false 
    } 

    reset() {
        this._observer?.disconnect()
        this._observer = undefined
    }
}

function listenForMessage(callback) {
    chrome.runtime.onMessage.addListener(message => {
        callback(message)
    })
}

function init() {
    const observerWrapper = new ObserverWrapper()

    function messageCallback(message) {
        message.active
          ? observerWrapper.hideUI() 
          : observerWrapper.showUI()
    }

    listenForMessage(messageCallback)
}

init()
