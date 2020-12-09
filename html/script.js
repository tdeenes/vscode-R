// the javascript file script.js is generated from script.ts

// used to communicate with vscode, can only be invoked once:
// @ts-ignore
var vscode = acquireVsCodeApi();
// notify vscode when mouse buttons are clicked
// used to implement back/forward on mouse buttons 3/4
window.onmousedown = function (ev) {
    vscode.postMessage({
        message: 'mouseClick',
        button: ev.button,
        scrollY: window.scrollY
    });
};
// find-in-topic widget
var initSearchWidget = function (options) {
    // init mark.js
    var markInstance = new Mark(document.body);
    // the marked elements
    var results;
    function validResults(check_length) {
        var valid = results !== null && results !== undefined;
        if (!valid)
            return false;
        if (check_length)
            valid = results.length > 0;
        return valid;
    }
    // the position of the current result within all results
    var currentIndex = 0;
    // the main widget 
    var widget = document.createElement('div');
    widget.classList.add('find-header');
    widget.style.display = 'none';
    // helper function - jump to given result
    var offsetTop = 50;
    function highlight(element) {
        if (element instanceof HTMLElement) {
            element.classList.add('current');
        }
    }
    function unhighlight(element) {
        if (element instanceof HTMLElement) {
            element.classList.remove('current');
        }
    }
    function jumpTo(from, to) {
        if (!validResults(true))
            return;
        var len = results.length;
        var max_to = len - 1;
        if (from >= 0)
            unhighlight(results[from]);
        if (to > max_to)
            to = 0;
        if (to < 0)
            to = max_to;
        highlight(results[to]);
        currentIndex = to;
        var el = results[currentIndex];
        if (el instanceof HTMLElement) {
            var position = el.offsetTop - offsetTop;
            window.scrollTo(0, position);
        }
    }
    // search input 
    var input = document.createElement('input');
    input.setAttribute('type', 'search');
    input.setAttribute('placeholder', 'Find in topic');
    input.setAttribute('incremental', 'true');
    widget.appendChild(input);
    input.addEventListener('search', function () {
        var searchVal = input.value;
        markInstance.unmark({
            done: function () {
                markInstance.mark(searchVal, {
                    done: function () {
                        results = document.body.getElementsByTagName(options.element);
                        currentIndex = 0;
                        jumpTo(-1, currentIndex);
                    }
                });
            }
        });
    });
    // Jump to the next result
    var nextBtn = document.createElement('button');
    nextBtn.setAttribute('data-search', 'next');
    nextBtn.innerText = '↓';
    nextBtn.title = 'Jump to next (F3)';
    function jumpNext() {
        jumpTo(currentIndex, currentIndex + 1);
    }
    nextBtn.onclick = jumpNext;
    widget.appendChild(nextBtn);
    // Jump to the previous result
    var prevBtn = document.createElement('button');
    prevBtn.setAttribute('data-search', 'prev');
    prevBtn.innerText = '↑';
    prevBtn.title = 'Jump to previous (Shift+F3)';
    function jumpPrevious() {
        jumpTo(currentIndex, currentIndex - 1);
    }
    prevBtn.onclick = jumpPrevious;
    widget.appendChild(prevBtn);
    // Clear the search field and hide the widget
    var clearBtn = document.createElement('button');
    clearBtn.setAttribute('data-search', 'clear');
    clearBtn.innerText = '✖';
    clearBtn.title = 'Cancel (Esc)';
    function cancelSearch() {
        markInstance.unmark();
        input.value = '';
        currentIndex = 0;
        widget.style.display = "none";
    }
    clearBtn.onclick = cancelSearch;
    widget.appendChild(clearBtn);
    // button presses
    document.addEventListener("keydown", function (event) {
        if (!validResults(false))
            return;
        if (event.shiftKey && event.key == "F3") {
            jumpPrevious();
        }
        else if (event.key == "F3") {
            jumpNext();
        }
        else if (event.key == "Escape") {
            cancelSearch();
        }
    });
    // finalize
    document.body.appendChild(widget);
    return widget;
};
// activate search widget
function activateSearchWidget(widget) {
    widget.style.display = "flex";
    widget.getElementsByTagName('input')[0].focus();
}
// do everything after loading the body
window.document.body.onload = function () {
    var _a;
    // initialize find-in-topic widget
    var markOpts = { element: "mark" };
    var searchWidget = initSearchWidget(markOpts);
    // make relative path for hyperlinks
    var relPath = (document.body.getAttribute('relPath') || '');
    var loc = document.location;
    var url0 = new URL(loc.protocol + '//' + loc.host);
    var url1 = new URL(relPath, url0);
    // scroll to desired position:
    var scrollYTo = Number((_a = document.body.getAttribute('scrollYTo')) !== null && _a !== void 0 ? _a : -1);
    if (scrollYTo >= 0) {
        window.scrollTo(0, scrollYTo);
    }
    else if (url1.hash) {
        document.location.hash = url1.hash;
    }
    // notify vscode when links are clicked:
    var hyperLinks = document.getElementsByTagName('a');
    var _loop_1 = function (i) {
        var hrefAbs = hyperLinks[i].href;
        var hrefRel = hyperLinks[i].getAttribute('href') || '';
        if (hrefRel.startsWith('#')) {
            hyperLinks[i].onclick = function () {
                document.location.hash = hrefRel;
            };
        }
        else if (hrefAbs && hrefAbs.startsWith('vscode-webview://')) {
            hyperLinks[i].onclick = function () {
                var url2 = new URL(hrefRel, url1);
                var finalHref = url2.toString();
                vscode.postMessage({
                    message: 'linkClicked',
                    href: finalHref,
                    scrollY: window.scrollY
                });
            };
        }
    };
    for (var i = 0; i < hyperLinks.length; i++) {
        _loop_1(i);
    }
    // Which text fragments shall be highlighted
    // Handle the message inside the webview
    window.addEventListener('message', function (event) {
        var message = event.data;
        switch (message.command) {
            case 'find':
                activateSearchWidget(searchWidget);
            default:
                false;
        }
    });
};
