class ObserverWrapper {
    #observer
    #selector = 'ytd-app'
    #isHidden = true
    #config = { childList: true, subtree: true }

    constructor() {
        this.#observer = undefined
    }

    #composeObserver() {
        const composeBox = document.querySelector(this.#selector)

        const mutationObserver = new MutationObserver(this.#handleMutations);
        mutationObserver.observe(composeBox, this.#config)

        this.#observer = mutationObserver
    }

    #isMenuOption(mutation) {
        const { localName, innerText } = mutation.target
        return localName === 'yt-formatted-string' && innerText === 'Add to queue'
    }

    #isPlaylistIconHover(mutation) {
        const { target, addedNodes } = mutation
        return !!addedNodes?.length && target.id === 'hover-overlays'
    }

    #isChildList(mutation) {
        return mutation.type === 'childList'
    }

    #filterMutations = (mutation) => {
        return this.#isChildList(mutation) &&
            (this.#isPlaylistIconHover(mutation) || this.#isMenuOption(mutation))
    }

    #handleMutations = (mutationsList) => {
        const filteredList = mutationsList.filter(this.#filterMutations)

        if (!filteredList?.length) return
        this.#toggleQueueUI(filteredList)
    }

    #toggleQueueUI(mutationsList) {
        const display = this.#isHidden ? 'none' : 'block'

        for (let mutation of mutationsList) {
            const { target, addedNodes } = mutation

            if (this.#isPlaylistIconHover(mutation)) {
                const playlistIcon = Array.from(addedNodes).find((a) => a.ariaLabel === 'Add to queue')
                playlistIcon?.setAttribute('style', `display: ${display}`)
            }

            if (this.#isMenuOption(mutation)) {
                const element = target.parentElement.parentElement;
                element?.setAttribute('style', `display: ${display}`)
            }
        }
    }

    hideUI() {
        this.#isHidden = true
        if (!this.#observer) {
            this.#composeObserver()
        }
    }

    showUI() {
        this.#isHidden = false
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
