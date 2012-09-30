/*
 *  Copyright 2012 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define('contextmenu', function (require, exports, module) {
/*
 *  Copyright 2012 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var MAX_NUM_ITEMS_IN_PORTRAIT_PEEK_MODE = 7,
    MAX_NUM_ITEMS_IN_LANDSCAPE_PEEK_MODE = 3,
    PEEK_MODE_TRANSLATE_X = -121,
    FULL_MENU_TRANSLATE_X = -569,
    MENU_ITEM_HEIGHT = 121,
    HIDDEN_MENU_TRANSLATE_X = 0,
    state = {
        HIDE: 0,
        PEEK: 1,
        VISIBLE: 2,
        DRAGEND: 3
    },
    maxNumItemsInPeekMode = MAX_NUM_ITEMS_IN_PORTRAIT_PEEK_MODE,
    menuCurrentState = state.HIDE,
    touchMoved = false,
    numItems = 0,
    peekModeNumItems = 0,
    dragStartPoint,
    currentTranslateX,
    menu,
    contextMenuContent,
    contextMenuHandle,
    contextMenuDelete,
    contextMenuModal,
    headText,
    subheadText,
    currentPeekIndex,
    previousPeekIndex,
    elements,
    self;

function getMenuXTranslation() {
    if (menuCurrentState === state.PEEK) {
        return PEEK_MODE_TRANSLATE_X;
    }
    if (menuCurrentState === state.VISIBLE) {
        return FULL_MENU_TRANSLATE_X;
    }
    return HIDDEN_MENU_TRANSLATE_X;
}

function positionHandle() {
    var moreIcon = document.getElementById('moreHandleIcon'),
        top;

    if (menuCurrentState === state.PEEK) {
        contextMenuHandle.className = 'showContextMenuHandle';
        top = (window.screen.availHeight + (peekModeNumItems - 1) * MENU_ITEM_HEIGHT) / 2;
        contextMenuHandle.style.top = top + 'px';

        // If have more options than the limit, show the more dots on the contextMenuHandle
        if (numItems > maxNumItemsInPeekMode) {
            contextMenuContent.style.top = '-75px';
            if (moreIcon === null) {
                moreIcon = document.createElement('img');
                moreIcon.id = "moreHandleIcon";
                moreIcon.style = 'showMoreHandleIcon';
                moreIcon.src = 'assets/ActionOverflowMenu.png';
                moreIcon.className = 'showMoreHandleIcon';
                contextMenuHandle.appendChild(moreIcon);
            }
        } else {
            contextMenuContent.style.top = '';
            if (numItems < maxNumItemsInPeekMode && moreIcon !== null) {
                contextMenuHandle.removeChild(moreIcon);
            }
        }
    } else if (menuCurrentState === state.VISIBLE) {
        if (numItems <= maxNumItemsInPeekMode) {
            contextMenuContent.style.top = '';
            contextMenuHandle.className = 'showContextMenuHandle';
            top = (window.screen.availHeight + (numItems - 1) * MENU_ITEM_HEIGHT) / 2;
            contextMenuHandle.style.top = top + 'px';
        } else {
            contextMenuHandle.className = 'hideContextMenuHandle';
        }
    }
}

function menuDragStart() {
    menu.style.webkitTransitionDuration = '0s';
}

function menuDragMove(pageX) {
    var x = window.screen.width + getMenuXTranslation() + pageX - dragStartPoint,
        menuWidth = -FULL_MENU_TRANSLATE_X;
    // Stop translating if the full menu is on the screen
    if (x >= window.screen.width - menuWidth) {
        currentTranslateX = getMenuXTranslation() + pageX - dragStartPoint;
        menu.style.webkitTransform = 'translate(' + currentTranslateX + 'px' + ', 0)';
    }
}

function menuDragEnd() {
    menu.style.webkitTransitionDuration = '0.25s';

    menuCurrentState = state.DRAGEND;
    if (currentTranslateX > PEEK_MODE_TRANSLATE_X) {
        self.hideContextMenu();
    } else if (currentTranslateX < FULL_MENU_TRANSLATE_X / 2) {
        self.showContextMenu();
    } else {
        self.peekContextMenu();
    }

    menu.style.webkitTransform = '';
}

function menuTouchStartHandler(evt) {
    evt.stopPropagation();
    menuDragStart();
    dragStartPoint = evt.touches[0].pageX;
}

function bodyTouchStartHandler(evt) {
    dragStartPoint = evt.touches[0].pageX;
    menuDragStart();
}

function menuTouchMoveHandler(evt) {
    evt.stopPropagation();
    touchMoved = true;
    menuDragMove(evt.touches[0].pageX);
}

function bodyTouchMoveHandler(evt) {
    touchMoved = true;
    menuDragMove(evt.touches[0].pageX);
}

function menuTouchEndHandler(evt) {
    evt.stopPropagation();
    if (touchMoved) {
        touchMoved = false;
        menuDragEnd();
    } else {
        if (menuCurrentState === state.PEEK) {
            self.showContextMenu();
        } else if (menuCurrentState === state.VISIBLE) {
            self.peekContextMenu();
        }
    }
}

function bodyTouchEndHandler(evt) {
    if (touchMoved) {
        touchMoved = false;
        menuDragEnd();
    }
    else {
        self.hideContextMenu();
    }
}

function getMenuItemAtPosition(currentYPosition, elementHeight) {
    if (currentYPosition >= contextMenuContent.offsetTop && currentYPosition <= contextMenuContent.offsetTop + contextMenuContent.clientHeight) {
        return (currentYPosition - contextMenuContent.offsetTop) / elementHeight | 0;
    }

    if (currentYPosition > contextMenuDelete.offsetTop) {
        return elements.length - 1;
    }
    return -1;
}

function highlightMenuItem(item) {
    var previousHighlightedItems,
        i;

    if (menuCurrentState === state.PEEK) {
        item.className = 'contextmenuItem showContextmenuItem';
        item.active = true;
    } else if (menuCurrentState === state.VISIBLE) {
        // If we have any other item's that are highlighted, force remove it since we can only have one
        previousHighlightedItems = document.getElementsByClassName('fullContextmenuItem');

        for (i = 0; i < previousHighlightedItems.length; i += 1) {
            previousHighlightedItems[i].className = 'contextmenuItem';
        }

        item.className = 'contextmenuItem fullContextmenuItem';
        item.active = true;
    }
}

function menuItemTouchStartHandler(evt) {
    evt.stopPropagation();
    highlightMenuItem(evt.currentTarget);
    previousPeekIndex = currentPeekIndex = evt.currentTarget.index;
}

function menuItemTouchMoveHandler(evt) {
    var currentYPosition = evt.touches[0].clientY,
        elementHeight = evt.currentTarget.clientHeight + 2; // border = 2

    evt.stopPropagation();

    currentPeekIndex = getMenuItemAtPosition(currentYPosition, elementHeight);
    if (currentPeekIndex === previousPeekIndex) {
        return;
    }
    if (currentPeekIndex === -1) {
        if (elements[previousPeekIndex].active) {
            elements[previousPeekIndex].className = 'contextmenuItem';
            elements[previousPeekIndex].active = false;
        }
    } else if (previousPeekIndex === -1) {
        highlightMenuItem(elements[currentPeekIndex]);
    } else {
        if (elements[previousPeekIndex].active) {
            elements[previousPeekIndex].className = 'contextmenuItem';
            elements[previousPeekIndex].active = false;
        }
        highlightMenuItem(elements[currentPeekIndex]);
    }
    previousPeekIndex = currentPeekIndex;
}

function menuItemTouchEndHandler(evt) {
    var elements,
        i;

    evt.stopPropagation();
    if (currentPeekIndex !== -1) {

        // Clear all the highlighted elements since the highlight can get stuck when scrolling a list when we
        // are using overflow-y scroll
        elements = document.getElementsByClassName('contextmenuItem');

        for (i = 0; i < elements.length; i += 1) {
            elements[i].className = 'contextmenuItem';
            elements[i].active = false;
        }

        window.qnx.webplatform.getController().remoteExec(1, 'executeMenuAction', [elements[currentPeekIndex].attributes.actionId.value]);
        self.hideContextMenu();
    }
}

function rotationHandler() {
    if (window.orientation === 0 || window.orientation === 180) {
        maxNumItemsInPeekMode = MAX_NUM_ITEMS_IN_PORTRAIT_PEEK_MODE;
    } else {
        maxNumItemsInPeekMode = MAX_NUM_ITEMS_IN_LANDSCAPE_PEEK_MODE;
    }
    self.hideContextMenu();
}

function mouseDownHandler(evt) {
    evt.preventDefault();
    evt.stopPropagation();
}

function contextMenuHandler(evt) {
    evt.preventDefault();
    evt.stopPropagation();
}

function setHeadText(text) {
    var headTextElement = document.getElementById('contextMenuHeadText');
    headTextElement.innerText = text;

    if (text) {
        if (!subheadText || subheadText === '') {
            headTextElement.style.height = '105px';
            headTextElement.style.lineHeight = '105px';
        } else {
            headTextElement.style.height = '60px';
            headTextElement.style.lineHeight = '60px';
        }

    } else {
        headTextElement.style.height = '0px';
    }
}

function setSubheadText(text) {
    var subheadTextElement = document.getElementById('contextMenuSubheadText');
    subheadTextElement.innerText = text;

    if (text) {
        if (!headText || headText === '') {
            subheadTextElement.style.height = '105px';
            subheadTextElement.style.lineHeight = '105px';
        } else {
            subheadTextElement.style.height = '60px';
            subheadTextElement.style.lineHeight = '60px';
        }
    } else {
        subheadTextElement.style.height = '0px';
    }
}

function resetHeader() {
    var header = document.getElementById('contextMenuHeader');

    // Always hide the header div whenever we are peeking
    if (headText || subheadText) {
        header = document.getElementById('contextMenuHeader');
        header.className = '';
        if (headText) {
            setHeadText('');
        }
        if (subheadText) {
            setSubheadText('');
        }
    }
}

function resetMenuContent() {
    contextMenuContent.style.position = '';
    contextMenuContent.style.top = '';
    contextMenuContent.style.height = '';
    contextMenuContent.style.overflowY = '';
}

function init() {
    menu = document.getElementById('contextMenu');
    menu.addEventListener('webkitTransitionEnd', self.transitionEnd.bind(self));
    menu.addEventListener('touchstart', menuTouchStartHandler);
    menu.addEventListener('touchmove', menuTouchMoveHandler);
    menu.addEventListener('touchend', menuTouchEndHandler);
    menu.addEventListener('contextmenu', contextMenuHandler);
    contextMenuContent = document.getElementById('contextMenuContent');
    contextMenuDelete = document.getElementById('contextMenuDelete');
    contextMenuHandle = document.getElementById('contextMenuHandle');
    contextMenuModal = document.getElementById('contextMenuModal');
    setHeadText('');
    setSubheadText('');
    rotationHandler();
    window.addEventListener('orientationchange', rotationHandler, false);
}

function buildMenuItem(options) {
    var menuItem,
        imageUrl = options.imageUrl || options.icon || 'assets/generic_81_81_placeholder.png';

    menuItem = document.createElement('div');
    menuItem.style.backgroundImage = "url(" + imageUrl + ")";
    menuItem.appendChild(document.createTextNode(options.label));
    menuItem.setAttribute("class", "contextmenuItem");

    menuItem.setAttribute("actionId", options.actionId);
    menuItem.index = numItems;
    menuItem.active = false;
    menuItem.addEventListener('mousedown', self.mouseDownHandler);
    menuItem.addEventListener('touchstart', menuItemTouchStartHandler);
    menuItem.addEventListener('touchmove', menuItemTouchMoveHandler);
    menuItem.addEventListener('touchend', menuItemTouchEndHandler);

    if (options.isDelete || options.actionId === 'Delete') {
        menuItem.isDelete = true;
    }

    return menuItem;
}

self = {
    init: init,
    mouseDownHandler: mouseDownHandler,
    setMenuOptions: function (options) {
        var menuItem,
            deleteMenuItem,
            i;

        for (i = 0; i < options.length; i++) {
            if (options[i].headText || options[i].subheadText) {
                if (options[i].headText) {
                    headText = options[i].headText;
                }
                if (options[i].subheadText) {
                    subheadText = options[i].subheadText;
                }
                continue;
            }

            menuItem = buildMenuItem(options[i]);

            if (menuItem.isDelete) {
                while (contextMenuDelete.firstChild) {
                    contextMenuDelete.removeChild(contextMenuDelete.firstChild);
                }
                contextMenuDelete.appendChild(menuItem);
                deleteMenuItem = buildMenuItem(options[i]);
                deleteMenuItem.setAttribute('class', 'hideContextMenuItem');
                contextMenuContent.appendChild(deleteMenuItem);
            } else {
                if (numItems >= maxNumItemsInPeekMode) {
                    menuItem.setAttribute('class', 'hideContextMenuItem');
                }
                contextMenuContent.appendChild(menuItem);
            }

            numItems++;
        }
    },

    showContextMenu: function (evt) {
        var i,
            header,
            items;

        if (menuCurrentState === state.VISIBLE) {
            return;
        }
        menu.style.webkitTransitionDuration = '0.25s';
        menu.className = 'showContextMenu';
        contextMenuContent.className = 'contentShown';
        contextMenuHandle.className = 'showContextMenuHandle';

        if (evt) {
            evt.preventDefault();
            evt.stopPropagation();
        }

        if (headText || subheadText) {
            header = document.getElementById('contextMenuHeader');
            header.className = 'showMenuHeader';
            if (headText) {
                setHeadText(headText);
            }
            if (subheadText) {
                setSubheadText(subheadText);
            }
        }

        // Move content so that menu items won't be covered by header
        // And scale the height to be 80% for scrolling if we have more numItems
        if (numItems > maxNumItemsInPeekMode) {
            contextMenuContent.style.position = 'absolute';
            contextMenuContent.style.top = (headText || subheadText) ? '131px' : '0px';
            contextMenuContent.style.height = (headText || subheadText) ? '80%': '100%';
            contextMenuContent.style.overflowY = 'scroll';
            contextMenuContent.scrollTop = 0;
        }

        items = contextMenuContent.childNodes;

        if (items.length > maxNumItemsInPeekMode) {
            for (i = maxNumItemsInPeekMode; i < items.length; i += 1) {
                items[i].className = 'contextmenuItem';
            }
            contextMenuDelete.style.webkitTransitionDuration = '0.25s';
            contextMenuDelete.className = 'hideContextMenuDelete';
        }

        menuCurrentState = state.VISIBLE;
        positionHandle();
    },

    isMenuVisible: function () {
        return menuCurrentState === state.PEEK || menuCurrentState === state.VISIBLE;
    },

    hideContextMenu: function (evt) {
        if (menuCurrentState === state.HIDE) {
            return;
        }

        numItems = 0;
        menu.style.webkitTransitionDuration = '0.25s';
        menu.className = 'hideMenu';

        menu.removeEventListener('touchstart', menuTouchStartHandler, false);
        menu.removeEventListener('touchmove', menuTouchMoveHandler, false);
        menu.removeEventListener('touchend', menuTouchEndHandler, false);

        window.document.body.removeEventListener('touchstart', bodyTouchStartHandler, false);
        window.document.body.removeEventListener('touchmove', bodyTouchMoveHandler, false);
        window.document.body.removeEventListener('touchend', bodyTouchEndHandler, false);

        while (contextMenuContent.firstChild) {
            contextMenuContent.removeChild(contextMenuContent.firstChild);
        }

        resetHeader();
        headText = '';
        subheadText = '';
        resetMenuContent();

        window.qnx.webplatform.getController().remoteExec(1, 'webview.notifyContextMenuCancelled');
        if (evt) {
            evt.preventDefault();
            evt.stopPropagation();
        }
        menuCurrentState = state.HIDE;

        // Reset sensitivity
        window.qnx.webplatform.getController().remoteExec(1, 'webview.setSensitivity', ['SensitivityTest']);
        contextMenuModal.style.display = 'none';
    },

    setHeadText: setHeadText,

    setSubheadText: setSubheadText,

    peekContextMenu: function (show, zIndex) {
        var i,
            items;

        if (menuCurrentState === state.PEEK) {
            return;
        }

        peekModeNumItems = numItems > maxNumItemsInPeekMode ? maxNumItemsInPeekMode : numItems;
        elements = document.getElementsByClassName("contextmenuItem");

        // Cache items for single item peek mode.
        window.qnx.webplatform.getController().remoteExec(1, "webview.setSensitivity", ["SensitivityNoFocus"]);
        contextMenuModal.style.display = '';

        menu.style.webkitTransitionDuration = '0.25s';
        menu.className = 'peekContextMenu';
        contextMenuHandle.className = 'showContextMenuHandle';

        if ((menuCurrentState === state.DRAGEND || menuCurrentState === state.VISIBLE)) {
            items = contextMenuContent.childNodes;

            if (items.length > maxNumItemsInPeekMode) {
                for (i = maxNumItemsInPeekMode; i < items.length; i += 1) {
                    items[i].className = 'hideContextMenuItem';
                }
            }

            // hide delete menu item
            for (i = 0; i < items.length; i += 1) {
                if (items[i].isDelete) {
                    items[i].className = 'hideContextMenuItem';
                }
            }
        }

        contextMenuDelete.style.webkitTransitionDuration = '0s';
        contextMenuDelete.className = '';

        resetHeader();
        resetMenuContent();

        // This is for single item peek mode
        menu.style.overflowX = 'visible';
        menu.style.overflowY = 'visible';

        window.document.body.addEventListener('touchstart', bodyTouchStartHandler);
        window.document.body.addEventListener('touchmove', bodyTouchMoveHandler);
        window.document.body.addEventListener('touchend', bodyTouchEndHandler);

        menuCurrentState = state.PEEK;
        positionHandle();
    },

    transitionEnd: function () {
        if (menuCurrentState === state.HIDE) {
            self.setHeadText('');
            self.setSubheadText('');
            headText = '';
            subheadText = '';
        }
    }
};

module.exports = self;

});

define('listBuilder', function (require, exports, module) {
/*
 *  Copyright 2012 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var listBuilder,
    listItems;

function init(request) {
    listItems = [];
}

function invokeApp(key) {
    // invoke some app based on ID
    console.log("invoking");
    var invokeRequest = listItems[key],
        args = [invokeRequest];

    window.qnx.webplatform.getController().remoteExec(1, "invocation.invoke", args);
    listBuilder.hide();
}

function handleMouseDown(evt) {
    evt.preventDefault();
}

listBuilder = {
    init: init,
    setHeader: function (headerText) {
        var listHeader = document.getElementById('listHeader');
        listHeader.innerHTML = "";
        listHeader.appendChild(document.createTextNode(headerText));
    },
    populateList: function (targets, request) {
        var listContent = document.getElementById('listContent'),
            listItem,
            i;

        // Reset listContent
        listContent.innerHTML = "";
        // create a bunch of subdivs
        for (i in targets) {
            if (targets.hasOwnProperty(i)) {
                listItem = document.createElement('div');
                listItem.appendChild(document.createTextNode(targets[i].label));
                listItem.setAttribute('class', 'listItem');
                listItem.addEventListener('mousedown', handleMouseDown, false);
                listItem.ontouchend = invokeApp.bind(this, targets[i].key);
                listItems[targets[i].key] = {
                    target : targets[i].key,
                    action : request.action,
                    type: request.type,
                    uri : request.uri,
                    data : window.btoa(request.data)
                };
                listContent.appendChild(listItem);
            }
        }
        // subdivs will have a click handler to run stuff
        // hide menu after handling a click
    },
    show: function () {
        // set css class to visible
        var listContainer = document.getElementById('listContainer');
        listContainer.setAttribute('class', 'showList');
    },
    hide: function () {
        // set css class to hidden
        var listContainer = document.getElementById('listContainer');
        listContainer.setAttribute('class', 'hideList');
    }
};

module.exports = listBuilder;

});

define('dialog', function (require, exports, module) {
/*
 * Copyright (C) Research In Motion Limited 2012. All rights reserved.
 */

var dialog,
    utils;

function requireLocal(id) {
    return require(!!require.resolve ? "../../" + id.replace(/\/chrome/, "") : id);
}

function hide(evt) {
    if (!x$('#dialog').hasClass('hidden')) {
        x$('#dialog').addClass('hidden');
    }
}

function show(desc) {
    var dialog = x$('#dialog'),
        panel = x$('#dialog-panel'),
        header = x$(document.createElement('div')),
        content = x$(document.createElement('div')),
        inputContainer,
        inputDesc,
        input,
        inputDesc2,
        input2,
        buttons = x$(document.createElement('div')),
        divider,
        divider2,
        button = x$(document.createElement('button')),
        button2,
        button3,
        classAutofill,
        res = {},
        url;

    //Check and parse the incoming description, since we use the executeJS into this context
    desc = typeof desc === 'string' ? JSON.parse(desc) : desc;
    url = desc.url;
    utils  = requireLocal("../chrome/lib/utils");

    if (!dialog.hasClass('hidden')) {
        dialog.addClass('hidden');
    }
    panel.html('inner', '');

    header.addClass('dialog-header');
    content.addClass('dialog-content');
    buttons.addClass('dialog-buttons');
    button.addClass('dialog-button');

    switch (desc.dialogType) {
    case 'JavaScriptAlert':
        header.bottom(x$(document.createTextNode(desc.title ? desc.title : "JavaScript Alert")));
        content.bottom(desc.htmlmessage ? desc.htmlmessage : x$(document.createTextNode(desc.message)));
        button.bottom(x$(document.createTextNode(desc.oklabel ? desc.oklabel : "OK")))
              .on('click', hide);
        panel.bottom(header)
             .bottom(content)
             .bottom(buttons
                .bottom(button));
        res.ok = button[0];
        break;
    case 'SSLCertificateException':
        header.bottom(x$(document.createTextNode(desc.title ? desc.title : "SSL Certificate Exception")));
        content.bottom(desc.htmlmessage ? desc.htmlmessage : x$(document.createTextNode(desc.message)));
        button.bottom(x$(document.createTextNode(desc.savelabel ? desc.savelabel : "Add Exception")))
            .on('click', hide);
        divider = x$(document.createElement('div'))
            .addClass('dialog-button-divider');
        button2 = x$(document.createElement('button'))
            .addClass('dialog-button')
            .bottom(x$(document.createTextNode(desc.cancellabel ? desc.cancellabel : "Don't Trust")))
            .on('click', hide);
        panel.bottom(header)
            .bottom(content)
            .bottom(buttons
                .bottom(button)
                .bottom(divider)
                .bottom(button2));
        res.save = button[0];
        res.cancel = button2[0];
        break;
    case 'InsecureSubresourceLoadPolicyConfirm':
        desc.title = "Insecure Contents Confirm";
        desc.oklabel = "Yes";
        desc.cancellabel = "No";
        /* falls through */
    case 'JavaScriptConfirm':
        header.bottom(x$(document.createTextNode(desc.title ? desc.title : "JavaScript Confirm")));
        content.bottom(desc.htmlmessage ? desc.htmlmessage : x$(document.createTextNode(desc.message)));
        button.bottom(x$(document.createTextNode(desc.oklabel ? desc.oklabel : "OK")))
              .on('click', hide);
        divider = x$(document.createElement('div'))
            .addClass('dialog-button-divider');
        button2 = x$(document.createElement('button'))
            .addClass('dialog-button')
            .bottom(x$(document.createTextNode(desc.cancellabel ? desc.cancellabel : "Cancel")))
            .on('click', hide);

        panel.bottom(header)
             .bottom(content)
             .bottom(buttons
                .bottom(button)
                .bottom(divider)
                .bottom(button2));

        if (desc.thirdOptionLabel) {
            button3 = x$(document.createElement('button'))
                .addClass('dialog-button')
                .bottom(x$(document.createTextNode(desc.thirdOptionLabel)))
                .on('click', hide);
            buttons
                .bottom(x$(document.createElement('div'))
                    .addClass('dialog-button-divider'))
                .bottom(button3);
            res.thirdOptionButton = button3[0];
        }

        res.ok = button[0];
        res.cancel = button2[0];
        res.oktext = 'true';
        break;
    case 'JavaScriptPrompt':
        header.bottom(x$(document.createTextNode(desc.title ? desc.title : "JavaScript Prompt")));
        input = x$(document.createElement('input'))
            .attr('type', 'text')
            .addClass('dialog-input')
            .on('keydown', function (keyEvent) {
                if (parseInt(keyEvent.keyCode, 10) === 13) {
                    button.click();
                }
            });
        content.bottom(desc.htmlmessage ? desc.htmlmessage : x$(document.createTextNode(desc.message)));
        button.bottom(x$(document.createTextNode(desc.oklabel ? desc.oklabel : "OK")))
              .on('click', hide);
        divider = x$(document.createElement('div'))
            .addClass('dialog-button-divider');
        button2 = x$(document.createElement('button'))
            .addClass('dialog-button')
            .bottom(x$(document.createTextNode(desc.cancellabel ? desc.cancellabel : "Cancel")))
            .on('click', hide);

        panel.bottom(header)
             .bottom(content
                .bottom(input))
             .bottom(buttons
                .bottom(button)
                .bottom(divider)
                .bottom(button2));

        res.ok = button[0];
        res.cancel = button2[0];
        res.__defineGetter__('oktext', function () {
            return input[0].value;
        });
        break;
    case 'AuthenticationChallenge':
        header.bottom(x$(document.createTextNode(desc.title ? desc.title : (desc.isProxy ? "Proxy Authentication Required" : "Authentication Required"))));
        content.bottom(x$(document.createElement('div')).inner("Connecting to " + utils.parseUri(url).host));
        if (url.indexOf("https://") === 0) {
            content.bottom(x$(document.createElement('div')).inner("via SSL connection"));
        }
        content.bottom(desc.htmlmessage ? desc.htmlmessage : x$(document.createTextNode(desc.message)));
        inputContainer = x$(document.createElement('div'))
            .addClass('dialog-input-container');
        classAutofill = 'dialog-input-autofill';
        inputDesc = x$(document.createTextNode('User Name:'));
        input = x$(document.createElement('input'))
            .attr('type', 'text')
            .attr('autocomplete', 'off')
            .addClass('dialog-input')
            .on('keydown', function (keyEvent) {
                if (parseInt(keyEvent.keyCode, 10) === 13) {
                    input2[0].focus();
                    return;
                }
                if (input.hasClass(classAutofill)) {
                    input.removeClass(classAutofill);
                    input2.removeClass(classAutofill);
                    input2[0].value = '';
                }
            });
        if (desc.username) {
            input.attr('value', decodeURIComponent(desc.username)).addClass(classAutofill);
        }
        inputDesc2 = x$(document.createTextNode('Password:'));
        input2 = x$(document.createElement('input'))
            .attr('type', 'password')
            .addClass('dialog-input')
            .on('keydown', function (keyEvent) {
                if (parseInt(keyEvent.keyCode, 10) === 13) {
                    button.click();
                    return;
                }
                if (input2.hasClass(classAutofill)) {
                    input2.removeClass(classAutofill);
                }
            });
        if (desc.password) {
            input2.attr('value', decodeURIComponent(desc.password)).addClass(classAutofill);
        }
        button.bottom(x$(document.createTextNode(desc.oklabel ? desc.oklabel : "OK")))
                .on('click', hide);
        divider = x$(document.createElement('div'))
            .addClass('dialog-button-divider');
        button2 = x$(document.createElement('button'))
            .addClass('dialog-button')
            .bottom(x$(document.createTextNode(desc.cancellabel ? desc.cancellabel : "Cancel")))
            .on('click', hide);

        panel.bottom(header)
            .bottom(content
                .bottom(inputContainer
                    .bottom(inputDesc)
                    .bottom(input)
                    .bottom(inputDesc2)
                    .bottom(input2)))
            .bottom(buttons
                .bottom(button)
                .bottom(divider)
                .bottom(button2));

        res.ok = button[0];
        res.cancel = button2[0];
        res.__defineGetter__('username', function () {
            return input[0].value;
        });
        res.__defineGetter__('password', function () {
            return input2[0].value;
        });
        res.oktext = 'true';
        break;
    case 'SaveCredential':
        header.bottom(x$(document.createTextNode(desc.title ? desc.title : "Signing In")));
        content.bottom(desc.htmlmessage ? desc.htmlmessage : x$(document.createTextNode(desc.message)));
        button.bottom(x$(document.createTextNode(desc.oklabel ? desc.oklabel : "Save")))
            .on('click', hide);
        divider = x$(document.createElement('div'))
            .addClass('dialog-button-divider');
        button2 = x$(document.createElement('button'))
            .addClass('dialog-button')
            .bottom(x$(document.createTextNode(desc.neverlabel ? desc.neverlabel : "Never")))
            .on('click', hide);
        divider2 = x$(document.createElement('div'))
            .addClass('dialog-button-divider');
        button3 = x$(document.createElement('button'))
            .addClass('dialog-button')
            .bottom(x$(document.createTextNode(desc.cancellabel ? desc.cancellabel : "Ignore")))
            .on('click', hide);
        panel.bottom(header)
            .bottom(content)
            .bottom(buttons
                .bottom(button)
                .bottom(divider)
                .bottom(button2)
                .bottom(divider2)
                .bottom(button3));
        res.save = button[0];
        res.never = button2[0];
        res.cancel = button3[0];
        break;

    case 'Generic':
    case 'GeolocationPermission':
    case 'NotificationPermission':
    case 'DatabaseQuotaExceeded':
        /* falls through */
    default:
        return;
    }
    dialog.removeClass('hidden');

    /*
     * This call is executed from a different context, therefore we can't
     * really return a value. We need to expose a call through the controller
     * publish remote function
     */

    return res;
}

function showDialog(description) {

    var res = show(description),
        returnValue = {};
    if (res) {
        if (res.ok) {
            x$(res.ok).on('click', function () {
                returnValue.username = res.hasOwnProperty('username') ? encodeURIComponent(res.username) : '';
                returnValue.password = res.hasOwnProperty('password') ? encodeURIComponent(res.password) : '';
                returnValue.oktext = res.hasOwnProperty('oktext') ? encodeURIComponent(res.oktext) : '';
                returnValue.ok = true;
                window.qnx.webplatform.getController().remoteExec(1, 'dialog.result', [returnValue]);
            });
        }
        if (res.cancel) {
            x$(res.cancel).on('click', function () {
                returnValue.cancel = true;
                window.qnx.webplatform.getController().remoteExec(1, 'dialog.result', [returnValue]);
            });
        }
        if (res.save) {
            x$(res.save).on('click', function () {
                returnValue.save = true;
                window.qnx.webplatform.getController().remoteExec(1, 'dialog.result', [returnValue]);
            });
        }
        if (res.never) {
            x$(res.never).on('click', function () {
                returnValue.never = true;
                window.qnx.webplatform.getController().remoteExec(1, 'dialog.result', [returnValue]);
            });
        }
    }
}

dialog = {
    /**
     * description can have
     *   title - the title of the dialog
     *   message - the dialog's message. Text only
     *   htmlmessage - alternate message content, can contain HTML
     *   oklabel - the label for the primary/action/OK button
     *   cancellabel - the label for the secondary/dismiss/Cancel button
     *   neverlabel - the label for "never remember this site" action of save credential dialog
     *
     * @returns object res
     *   ok - The ok button element. Attach your click handlers here
     *   cancel - The cancel button element. Attach your click handlers here
     *   oktext - The string "true" for hitting OK on a Confirm, the input's value for hitting OK on a Prompt, or absent
     *   username - User name for authentication challenge dialog
     *   password - Password for authentication challenge dialog
     */
    showDialog: showDialog,
};

module.exports = dialog;

});

define('invocationlist', function (require, exports, module) {
/*
 * Copyright 2012 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var isShowing = false,
    userEvents = ['mousedown', 'mouseup', 'click', 'touchstart', 'touchmove', 'touchend'],
    PREVENT_INTERACTION_TIMEOUT = 2000, // 2 seconds
    SCREEN_TRANSITION_TIME = 250,
    SCREEN_TRANSITION_TIMEOUT = SCREEN_TRANSITION_TIME + 200,
    SCREEN_TRANSITION_TYPE = '-webkit-transform',
    SCREEN_TRANSITION_STYLE = SCREEN_TRANSITION_TYPE + ' ' + SCREEN_TRANSITION_TIME + 'ms ease-out',
    interactionTimeoutId = 0,
    zIndex = 100,
    invocationListScreen,
    listItems,
    request,
    results,
    self,
    title,
    touchDownPosition,
    pendingAnimationQueue = [],
    animationBlockers = 0,
    offscreenLocation = { LEFT: 'translate(-120%, 0)',
                          RIGHT: 'translate(120%, 0)',
                          TOP: 'translate(0, -120%)',
                          BOTTOM: 'translate(0, 120%)',
                          ONSCREEN: 'translate(0, 0)' },
    ScreenObj = function (domElement) {
        return {
            pushing: false,
            popping: false,
            popped: false,
            pushed: false,
            domElement: domElement
        };
    };

/*
    Screen Animation Coordinator
 */
function tryStartAnimating() {
    if (animationBlockers === 0) {
        var animation;
        while ((animation = pendingAnimationQueue.shift())) {
            animation();
        }
    }
}

function unblockAnimating() {
    animationBlockers--;
    if (animationBlockers < 0) {
        throw new Error('Attempt to unblock animations when there are none');
    }
    tryStartAnimating();
}

function blockAnimating() {
    animationBlockers++;
}

function forceLayout(element) {
    /* When animating elements that were just added to the DOM
       they first need to layed out or else the style will only
       calculated once and the transition animation will not occur */
    return document.defaultView.getComputedStyle(element, "").display;
}

function appendAnimation(animation) {
    pendingAnimationQueue.push(animation);
}

function animate() {
    tryStartAnimating();
}

function stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
}

function allowUserInteraction() {
    if (interactionTimeoutId === 0) {
        return;
    }
    clearTimeout(interactionTimeoutId);
    interactionTimeoutId = 0;
    console.log("allowing user interaction");
    userEvents.forEach(function (eventType) {
        document.removeEventListener(eventType, stopEvent, true);
    });
}

function preventUserInteraction() {
    if (interactionTimeoutId !== 0) {
        console.log('user interaction is already disabled');
        return;
    }

    userEvents.forEach(function (eventType) {
        document.addEventListener(eventType, stopEvent, true);
    });

    interactionTimeoutId = setTimeout(function () {
        console.error('prevent user interaction timeout occured');
        allowUserInteraction();
    }, PREVENT_INTERACTION_TIMEOUT);
}

function transitionWithTimeout(element, transition, transitionTimeout, callback) {
    var boundEvent,
       timeoutId,
       onEvent;

    onEvent = function (timeoutId, event) {
        if (event.target === element) {
            clearTimeout(timeoutId);
            element.removeEventListener("webkitTransitionEnd", boundEvent, false);
            if (callback) {
                callback();
            }
        }
    };

    if (callback) {
        // Last resort timer in case all frames of transition are dropped and webKitTransitionEnd event never fires
        timeoutId = setTimeout(function () {
            console.log("transistion timed out for " + element.id);
            element.removeEventListener("webkitTransitionEnd", boundEvent, false);
            callback();
        }, transitionTimeout);
        boundEvent = onEvent.bind(this, timeoutId);
        element.addEventListener("webkitTransitionEnd", boundEvent, false);
    }

    transition();
    return timeoutId; 
}

/*
    Screen Pushing / Popping Abstractions
 */

function screenPushed(screenObj) {
    allowUserInteraction();
    isShowing = true;
    screenObj.pushing = false;
    screenObj.domElement.style.webkitTransition = '';
    setTimeout(function () {
        screenObj.domElement.style.webkitTransition = SCREEN_TRANSITION_STYLE;
    }, 0);
}

function screenPopped(screenObj) {
    allowUserInteraction();
    screenObj.domElement.style.webkitTransition = '';
    isShowing = false;
    screenObj.popped = false;
    setTimeout(function () {
        screenObj.domElement.classList.add('removed');
        screenObj.domElement.style.webkitTransition = SCREEN_TRANSITION_STYLE;
        screenObj.domElement.removeEventListener('webkitTransitionEnd', screenObj.transitionEndListener);
    }, 0);
}

function animatePushScreen(screenObj) {
    screenObj.pushing = true;

    transitionWithTimeout(screenObj.domElement, function () {
        screenObj.domElement.style.webkitTransform = offscreenLocation.ONSCREEN;
    }, SCREEN_TRANSITION_TIMEOUT, screenPushed.bind(this, screenObj));
}

function animatePopScreen(screenObj) {
    screenObj.popping = true;

    transitionWithTimeout(screenObj.domElement, function () {
        screenObj.domElement.style.webkitTransform = offscreenLocation.BOTTOM;
    }, SCREEN_TRANSITION_TIMEOUT, screenPopped.bind(this, screenObj));

    zIndex -= 10;
}

function showActivityIndicator() {
    /// Hide the list and show the activity indicator
    document.getElementById('invocationListContent').classList.add('hidden');
    document.getElementById('targetLoader').classList.remove('hidden');
}

function invokeApp(key) {
    // invoke some app based on ID
    var invokeRequest = listItems[key],
        args = [invokeRequest];

    showActivityIndicator();

    // Callback for invoking an invocation is to hide the invocation list screen
    window.qnx.webplatform.getController().remoteExec(1, "invocation.invoke", args, function (error, response) {
        if (error) {
            //showError();
        } else {
            animatePopScreen(invocationListScreen);
        }
    });
}

function getInvocationListItemAtPosition(currentYPosition, elementHeight) {
    var list = document.getElementById('invocationListContent');

    if (currentYPosition >= list.offsetTop && currentYPosition <= list.offsetTop + list.clientHeight) {
        return (currentYPosition - list.offsetTop) / elementHeight | 0;
    } else {
        return -1;
    }
}

function handleListItemTouchStart(evt) {
    var currentYPosition = evt.touches[0].clientY;
    touchDownPosition = getInvocationListItemAtPosition(currentYPosition, evt.currentTarget.getBoundingClientRect().height);
}

function handleListItemTouchEnd(targets, evt) {
    var currentYPosition = evt.changedTouches[0].clientY,
        touchEndPosition = getInvocationListItemAtPosition(currentYPosition, evt.currentTarget.getBoundingClientRect().height);

    // Invoke app if we touch ended on the active element
    if (touchDownPosition === touchEndPosition) {
        invokeApp(targets[touchDownPosition].key);
    }
}

/*
    UI Widget Builders
 */

function populateList(parentId, targets, request) {
    var listContent = document.getElementById(parentId),
        listItem,
        iconDiv,
        textDiv,
        i;

    listItems = [];

    // Reset listContent
    listContent.innerHTML = "";
    listContent.setAttribute('class', 'invocationListContainer');

    // create a bunch of subdivs
    for (i in targets) {
        if (targets.hasOwnProperty(i)) {
            listItem = document.createElement('div');

            iconDiv = document.createElement('div');
            iconDiv.setAttribute('class', 'invocationListItemIconDiv');

            iconDiv.style.backgroundImage = 'url(file://' + targets[i].icon + ')';

            textDiv = document.createElement('div');
            textDiv.setAttribute('class', 'invocationListItemText');
            textDiv.innerHTML = targets[i].label;

            listItem.appendChild(iconDiv);
            listItem.appendChild(textDiv);

            listItem.setAttribute('class', 'invocationListItem');
            listItem.addEventListener('touchstart', handleListItemTouchStart, false);
            listItem.addEventListener('touchend', handleListItemTouchEnd.bind(this, targets), false);

            listItems[targets[i].key] = {
                target : targets[i].key,
                action : request.action,
                type: request.type,
                uri : request.uri,
                data : window.btoa(request.data)
            };
            listContent.appendChild(listItem);
        }
    }
}

function createTitleWithCancel(parentId, titleText, cancelCallback) {
    var titleBarDiv = document.createElement('div'),
        title = document.createElement('div'),
        parentDiv = document.getElementById(parentId),
        cancelButton;

    parentDiv.innerHTML = '';

    titleBarDiv.setAttribute('class', 'cancelTitlebar');

    cancelButton = document.createElement('button');
    cancelButton.innerText = 'Cancel';
    cancelButton.addEventListener('click', function (evt) { 
        evt.preventDefault(); 
        cancelCallback(); 
    });
    titleBarDiv.appendChild(cancelButton);

    title.setAttribute('class', 'cancelTitlebarTitle');
    title.innerText = titleText;
    title.style.marginRight = '230px';
    titleBarDiv.appendChild(title);

    parentDiv.appendChild(titleBarDiv);
}

function init() {
    var screenDiv = document.getElementById('invocationlist');

    createTitleWithCancel('cancelTitlebar', title, self.hide);
    
    invocationListScreen = new ScreenObj(screenDiv);
    invocationListScreen.domElement.style.webkitTransform = offscreenLocation.BOTTOM;
    invocationListScreen.domElement.style.webkitTransition = SCREEN_TRANSITION_STYLE;

    // Need to force layout for DOM element to recognize style changes
    forceLayout(invocationListScreen.domElement);
}

// Expects a JSON objects with this structure:
//
// {
//  “action”:<action>,
//  "icon":<action_icon>,
//  "label":<action_label>,
//  "default":<target_default>,
//  "targets":
//  [
//     {
//       "key":<target_key>,
//       "icon":<target_icon>,
//       "splash":<target_splash>,
//       "label":<target_label>,
//       "type": <target_type>
//     }
//  ]
// }
function setContext(context) {
    request = context.request;
    results = context.results;
}

function show() {
    if (invocationListScreen.pushing || isShowing) {
        return;
    }

    preventUserInteraction();
    populateList('invocationListContent', results[0].targets, request);

    // Hide the activity indicator for now
    document.getElementById('targetLoader').classList.add('hidden');

    // Make sure the keyboard focus is cleared when switching views
    document.activeElement.blur();

    appendAnimation(animatePushScreen.bind(self, invocationListScreen));

    zIndex += 10;
    invocationListScreen.domElement.style.zIndex = zIndex;
    invocationListScreen.domElement.classList.remove('removed');

    // Need to force layout for DOM element to recognize style changes
    forceLayout(invocationListScreen.domElement);
    animate();    
}

self = {
    hide: function () {
        if (invocationListScreen.popping || !isShowing) {
            return;
        }

        preventUserInteraction();

        // Make sure the keyboard focus is cleared when switching screens
        document.activeElement.blur();

        appendAnimation(animatePopScreen.bind(self, invocationListScreen));
        animate();
    },

    show: function (args) {
        var currentContext = args[0];

        title = args[1];

        init();
        setContext(currentContext);
        show();
    }
};

module.exports = self;
});
