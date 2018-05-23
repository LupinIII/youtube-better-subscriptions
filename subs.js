const delayMilisecs = 3000; //TODO: configurable?

let storage = {};
let hidden = [];
let hideWatched = true;
const newLayout = document.querySelectorAll(".feed-item-container .yt-shelf-grid-item").length == 0; //is it the new (~fall 2017) YT layout?

function markWatched(item, videoId, button) {
    if (hideWatched) {
        hideItem(item);
    }

    button.remove();

    let obj = {};
    obj[videoId] = Date.now();
    getStorage().set(obj);
}

function hideItem(item) {
    hidden.push(item);
    item.style.display = 'none';
}

function showWatched() {
    for (it of hidden) {
        it.style.display = '';
    }
    hidden = [];
}

function checkboxChange() {
    let checkbox = document.getElementById("subs-grid");
    if (checkbox.checked) {
        hideWatched = true;
        removeWatched();
    } else {
        hideWatched = false;
        showWatched();
    }
}

function addHideWatchedCheckbox() {
    let subGridButtonContainer;
    if (newLayout) { //is new layout?
        subGridButtonContainer = document.createElement("h2");
        subGridButtonContainer.setAttribute("class", "style-scope ytd-shelf-renderer");
    } else {
        subGridButtonContainer = document.createElement("li");
        subGridButtonContainer.setAttribute("class", "yt-uix-menu-top-level-button yt-uix-menu-top-level-flow-button");
    }

    subGridButtonContainer.appendChild(document.createTextNode("Hide watched")); //TODO: translations

    let subGridCheckbox = document.createElement("input");
    subGridCheckbox.setAttribute("id", "subs-grid");
    subGridCheckbox.setAttribute("type", "checkbox");
    subGridCheckbox.checked = true;

    subGridButtonContainer.appendChild(subGridCheckbox);

    let feed;
    if (newLayout) { //is new layout?
        let buttonMenu = document.querySelectorAll("#title-container #menu");
        if (buttonMenu) {
            buttonMenu = buttonMenu[0].firstChild;
        }
        feed = buttonMenu ? buttonMenu : document.body;
    } else {
        feed = document.getElementsByClassName("yt-uix-menu-container feed-item-action-menu");
    }

    if (feed.length > 0) { //just in case
        feed[0].insertBefore(subGridButtonContainer, feed[0].firstChild);
    } else {
        feed.insertBefore(subGridButtonContainer, feed.childNodes[0]); //appendChild(subGridButtonContainer);
    }

    let messenger = document.getElementById("subs-grid");
    messenger.addEventListener("change", checkboxChange);
}

function buildButton(item, videoId) {
    let enclosingDiv = document.createElement("div");
    enclosingDiv.setAttribute("id", "metadata-line");
    enclosingDiv.setAttribute("class", "style-scope ytd-thumbnail-overlay-toggle-button-renderer");

    let button = document.createElement("button");
    button.setAttribute("id", "mark-watched");
    button.setAttribute("class", "subs-btn-mark-watched");
    button.setAttribute("role", "button");
    button.onclick = function () {
        markWatched(item, videoId, enclosingDiv);
    };

    enclosingDiv.appendChild(button);

    return enclosingDiv;
}

function getVideoIdFromUrl(url) {
    return url.split("=")[1].split("&")[0];
}

function getVideoId(item) {
    return getVideoIdFromUrl(item.querySelectorAll("a")[0].getAttribute("href"));
}

function removeWatchedAndAddButton() {
    let els = newLayout ? document.querySelectorAll("ytd-grid-video-renderer.style-scope.ytd-grid-renderer") : document.querySelectorAll(".feed-item-container .yt-shelf-grid-item");
    //TODO: OLD LAYOUT - still needed?

    for (item of els) {
        let stored = getVideoId(item) in storage;

        if (stored) {
            hideItem(item);
        } else {
            let dismissableDiv = item.firstChild;
            if (dismissableDiv.querySelectorAll("#mark-watched").length > 0) {
                continue;
            } else {
                dismissableDiv = dismissableDiv.firstChild;
            }

            let videoId = getVideoId(item);
            let button = buildButton(item, videoId);
            dismissableDiv.appendChild(button);
        }
    }
}

function storageChangeCallback(changes, area) {
    for (key in changes) {
        storage[key] = changes[key].newValue;
    }
}

getStorage().get(null, function (items) { //fill our map with watched videos
    storage = items;
});

addHideWatchedCheckbox();

brwsr.storage.onChanged.addListener(storageChangeCallback);

let intervalID = window.setInterval(function () {
    if (document.getElementById("subs-grid").checked) {
        removeWatchedAndAddButton();
    }
}, delayMilisecs);
