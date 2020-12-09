// the javascript file script.js is generated from script.ts

import Mark from "./mark.es6.min.js";

// used to communicate with vscode, can only be invoked once:
// @ts-ignore
const vscode = acquireVsCodeApi(); 

// notify vscode when mouse buttons are clicked
// used to implement back/forward on mouse buttons 3/4
window.onmousedown = (ev) => {
    vscode.postMessage({
        message: 'mouseClick',
        button: ev.button,
        scrollY: window.scrollY
    });
};

// Options for the find-in-topic widget
// See: https://markjs.io
interface SearchOptions {
  element: string,
  className?: string,
  exclude?: Array<any>,
  separateWordSearch?: boolean,
  accuracy?: "partially" | "complementary" | "exactly",
  diacritics?: boolean,
  synonyms?: object,
  acrossElements?: boolean,
  caseSensitive?: boolean,
  ignoreJoiners?: boolean,
  ignorePunctuation?: Array<string>,
  wildcards?: "disabled" | "enabled" | "withSpaces",
  debug?: boolean,
  log?: object  
}

// find-in-topic widget
let initSearchWidget = function(options: SearchOptions) {
  // init mark.js
  const markInstance = new Mark(document.body);
  // the marked elements
  let results:HTMLCollection | undefined;
  function validResults(check_length: boolean):boolean {
    let valid:boolean = results !== null && results !== undefined;
    if (!valid) return false;
    if (check_length) valid = results.length > 0;
    return valid;
  }
  // the position of the current result within all results
  let currentIndex = 0;
  // the main widget 
  const widget = document.createElement('div');
  widget.classList.add('find-header');
  widget.style.display = 'none';
  // helper function - jump to given result
  const offsetTop = 50;
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
  function jumpTo(from: number, to: number) {
    if (!validResults(true)) return;
    let len = results.length
    let max_to = len - 1;
    if (from >= 0) unhighlight(results[from]);
    if (to > max_to) to = 0; 
    if (to < 0) to = max_to;
    highlight(results[to]);
    currentIndex = to;
    let el = results[currentIndex];
    if (el instanceof HTMLElement) {
      let position:number = el.offsetTop - offsetTop;
      window.scrollTo(0, position);
    }
  }
  // search input 
  const input = document.createElement('input');
  input.setAttribute('type', 'search');
  input.setAttribute('placeholder', 'Find in topic');
  input.setAttribute('incremental', 'true');
  widget.appendChild(input);
  input.addEventListener('search', () => {
    let searchVal = input.value;
    markInstance.unmark({
      done: function() {
        markInstance.mark(searchVal, {
          done: function() {
            results = document.body.getElementsByTagName(options.element);
            currentIndex = 0;
            jumpTo(-1, currentIndex);
          }
        });
      }
    });
  })
  // Jump to the next result
  let nextBtn = document.createElement('button');
  nextBtn.setAttribute('data-search', 'next');
  nextBtn.innerText = '↓';
  nextBtn.title = 'Jump to next (F3)';
  function jumpNext() {
    jumpTo(currentIndex, currentIndex + 1);
  }
  nextBtn.onclick = jumpNext;
  widget.appendChild(nextBtn);
  // Jump to the previous result
  let prevBtn = document.createElement('button');
  prevBtn.setAttribute('data-search', 'prev');
  prevBtn.innerText = '↑';
  prevBtn.title = 'Jump to previous (Shift+F3)';
  function jumpPrevious() {
    jumpTo(currentIndex, currentIndex - 1);
  }
  prevBtn.onclick = jumpPrevious;
  widget.appendChild(prevBtn);
  // Clear the search field and hide the widget
  let clearBtn = document.createElement('button');
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
  document.addEventListener("keydown", event => {
    if (!validResults(false)) return;
    if (event.shiftKey && event.key == "F3") {
      jumpPrevious();
    } else if (event.key == "F3") {
      jumpNext();
    } else if (event.key == "Escape") {
      cancelSearch();
    } 
  });
  // finalize
  document.body.appendChild(widget);
  return widget;
} 

// activate search widget
function activateSearchWidget(widget) {
  widget.style.display = "flex";
  widget.getElementsByTagName('input')[0].focus();
}

// do everything after loading the body
window.document.body.onload = () => {

    // initialize find-in-topic widget
    const markOpts = {element: "mark"};
    let searchWidget = initSearchWidget(markOpts);
    
    // make relative path for hyperlinks
    const relPath = (document.body.getAttribute('relPath') || '');

    const loc = document.location;
    const url0 = new URL(loc.protocol + '//' + loc.host);
    const url1 = new URL(relPath, url0);

    // scroll to desired position:
    const scrollYTo = Number(document.body.getAttribute('scrollYTo') ?? -1);
    if(scrollYTo >= 0){
        window.scrollTo(0,scrollYTo);
    } else if(url1.hash){
        document.location.hash = url1.hash;
    }

    // notify vscode when links are clicked:
    const hyperLinks = document.getElementsByTagName('a'); 

    for(let i=0; i<hyperLinks.length; i++){
        const hrefAbs = hyperLinks[i].href;
        const hrefRel = hyperLinks[i].getAttribute('href') || '';

        if(hrefRel.startsWith('#')){
            hyperLinks[i].onclick = () => {
                document.location.hash = hrefRel;
            };
        } else if(hrefAbs && hrefAbs.startsWith('vscode-webview://')){
            hyperLinks[i].onclick = () => { 

                const url2 = new URL(hrefRel, url1);
                const finalHref = url2.toString();

                vscode.postMessage({
                    message: 'linkClicked',
                    href: finalHref,
                    scrollY: window.scrollY
                }); 
            };
        }
    }

    // Which text fragments shall be highlighted
    // Handle the message inside the webview
    window.addEventListener('message', event => {
      const message = event.data; 
      switch (message.command) {
          case 'find': 
            activateSearchWidget(searchWidget);
          default:
            false;
      }
    });
};

