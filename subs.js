const delayMilisecs = 3000; //TODO: configurable?

let storage = {};
let hidden = [];
let hideWatched = true;
let thumbnailContainer;
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

	thumbnailContainer = document.querySelectorAll("ytd-section-list-renderer#primary")[0];

	if (Object.keys(storage).length > 1000) { // 1000 - arbitrary number, maybe should be based on used storage bytes (not supported in FF yet)
		trim_storage(900); // trim down to 900 entries
	}
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

function removeWatchedAndAddButton() {
    let els = thumbnailContainer.querySelectorAll("ytd-grid-video-renderer.style-scope.ytd-grid-renderer");

    for (item of els) {
		let videoId = item.querySelectorAll("a#video-title")[0].getAttribute("href").match(/v=([-\w]+)/)[1];

        if (videoId in storage) {
            hideItem(item);
        } else {
            let dismissableDiv = item.firstChild;
            if (dismissableDiv.querySelectorAll("#mark-watched").length > 0) {
                continue;
            } else {
                dismissableDiv = dismissableDiv.firstChild;
            }

            let button = buildButton(item, videoId);
            dismissableDiv.appendChild(button);
        }
    }
}

function trim_storage(to_element_count) {
	videoId_sorted_by_value = Object.keys(storage).sort(function(a,b){return storage[a]-storage[b]}); // sort videoIds (object property names) by value (view date)
	if (videoId_sorted_by_value.length > to_element_count) {
		videoId_sorted_by_value.slice(0, videoId_sorted_by_value.length - to_element_count).forEach(function(videoId) { // remove first x videoIds (oldest watched) from storage
			getStorage().remove(videoId);
			delete storage[videoId];
		});
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

brwsr.storage.onChanged.addListener(storageChangeCallback);

let intervalID = window.setInterval(function () {
	if (document.getElementById("subs-grid") == null) {
		addHideWatchedCheckbox();
	}
    if (document.getElementById("subs-grid").checked) {
        removeWatchedAndAddButton();
    }
}, delayMilisecs);
