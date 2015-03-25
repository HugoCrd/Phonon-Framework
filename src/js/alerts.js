/* ========================================================================
* Phonon: alerts.js v0.0.1
* http://phonon.quarkdev.com
* ========================================================================
* Licensed under MIT (http://phonon.quarkdev.com)
* ======================================================================== */

'use strict';

;(function (window, document, Phonon, undefined) {

  var transitionEnd = 'webkitTransitionEnd';
  
  if (Phonon.animationEnd) {
      transitionEnd = (Phonon.animationPrefix === '' ? 'transitionend' : 'webkitTransitionEnd');
  }
  
  var lastTrigger = false;
  var moved = false;
  var panels = [];
  var busy = false;

  var createBackdrop = function () {
    var backdrop = document.createElement('div');
    backdrop.classList.add('backdrop-alert');
    return backdrop;
  };

  var findTrigger = function (target) {
    var triggers = document.querySelectorAll('[data-alert-id], [data-alert-close]'), i;
    for (; target && target !== document; target = target.parentNode) {
      for (i = triggers.length; i--;) {
        if (triggers[i] === target) {
          return target;
        }
      }
    }
  };

  var getPanel = function (event) {
    var panelToggle = findTrigger(event.target);
    if (panelToggle) {
      var panelId = panelToggle.getAttribute('data-alert-id');
      if(panelId) {
        return document.querySelector('#'+panelId);
      } else {
        return findPanel(event.target);
      }
    }
  };

  var findPanel = function (target) {
    var panels = document.querySelectorAll('.alert'), i;

    for (; target && target !== document; target = target.parentNode) {
      for (i = panels.length; i--;) {
        if (panels[i] === target && target.classList.contains('active')) {
          return target;
        }
      }
    }
  };

  var onItem = function (target) {
    for (; target && target !== document; target = target.parentNode) {
      if(target.getAttribute('selectable') === 'true') {
        return target;
      }
    }
  };

  window.addEventListener('touchstart', function (evt) {
    evt = evt.originalEvent || evt;

    if(panels.length > 0) {
      var previousPanel = panels[panels.length - 1].panel, p = findPanel(evt.target);

      if (!p) {
        console.log(previousPanel);

        if(previousPanel.getAttribute('data-cancelable') !== 'false') close(previousPanel);
      }

      if (p && p !== previousPanel) {
        // Case where there are two active panels
        if (p.id !== previousPanel.id) {
          close(previousPanel);
        }
      } 
    }
  });

  window.addEventListener('touchmove', function (evt) {
    evt = evt.originalEvent || evt;
    moved = true;
  });

  window.addEventListener('touchend', function (evt) {

    var trigger = findTrigger(evt.target), panel = null;

    if (trigger) {
      panel = getPanel(evt);

      lastTrigger = trigger;

      if(panel) {
        if(panel.classList.contains('active')) {
          close(panel);
        } else {
          open(panel);
        }
      }
    }

    panel = findPanel(evt.target);
    var item = onItem(evt.target);

    if(panel && item && !moved) {
        
      close(panel);

      evt = new CustomEvent('select', {
        detail: { item: item.textContent, target: evt.target },
        bubbles: true,
        cancelable: true
      });

      lastTrigger.textContent = item.textContent;

      panel.dispatchEvent(evt);
    }
    moved = false;
  });

  function onHide() {

    var page = document.querySelector('.app-page.app-active');
    if(page.querySelector('div.backdrop-alert') !== null) {

      var backdrop = panels[panels.length - 1].backdrop;
      backdrop.classList.remove('fadeout');

      page.removeChild(backdrop);

      var previousPanel = panels[panels.length - 1].panel;
      previousPanel.style.visibility = 'hidden';
      previousPanel.classList.remove('close');

      panels.pop();

      busy = false;

      this.removeEventListener(transitionEnd, onHide, false);
    }
  }

  function center (target) {

    var computedStyle = getComputedStyle(target),
    width = computedStyle.width,
    height = computedStyle.height;

    width = width.slice(0, width.length - 2);
    height = height.slice(0, height.length - 2);

    var left = (window.innerWidth / 2) - (width / 2),
        top = (window.innerHeight / 2) - (height / 2);

    target.style.marginLeft = left + 'px';
    target.style.marginTop = top + 'px';
  }

  /**
   * Public API
  */

  function open (el) {
    var panel = (typeof el === 'string' ? document.querySelector(el) : el);
    if(panel === null) {
      throw new Error('The panel with ID ' + el + ' does not exist');
    }

    if(busy) {
      return;
    }

    panel.style.visibility = 'visible';


    if(!panel.classList.contains('active')) {

      center(panel);

      panel.classList.add('active');


      var backdrop = createBackdrop();

      panels.push( {panel: panel, backdrop: backdrop} );

      document.querySelector('.app-page.app-active').appendChild(backdrop);
    }
  }

  function close (el) {
    var panel = (typeof el === 'string' ? document.querySelector(el) : el);
    if(panel === null) {
      throw new Error('The panel with ID ' + el + ' does not exist');
    }

    if(busy) {
      return;
    }

    if(panel.classList.contains('active') && !busy) {
      
      busy = true;

      panel.classList.remove('active');
      panel.classList.add('close');

      var backdrop = panels[panels.length - 1].backdrop;

      backdrop.classList.add('fadeout');

      backdrop.addEventListener(transitionEnd, onHide, false);
    }
  }

  function toggle(el) {
    var panel = (typeof el === 'string' ? document.querySelector(el) : el);
    if(panel === null) {
      throw new Error('The panel with ID ' + el + ' does not exist');
    }
    
    if(panel.classList.contains('active')) {
      close(panel);
    } else {
      open(panel);
    }
  }


  Phonon.Alert = function (el) {
    var panel = (typeof el === 'string' ? document.querySelector(el) : el);
    if(panel === null) {
      throw new Error('The panel with ID ' + el + ' does not exist');
    }

    return {
      open: function () {
        open(panel);
        return this;
      },
      close: function () {
        close(panel);
        return this;
      },
      toggle: function () {
        toggle(panel);
        return this;
      }
    };
  };
  window.Phonon = Phonon;

  if (typeof define === 'function' && define.amd) {
      define(function () {
          if(Phonon.returnGlobalNamespace === true) {
              return Phonon;
          } else {
              return Phonon.Alert;
          }
      });
  } else if (typeof module === 'object' && module.exports) {
      if(Phonon.returnGlobalNamespace === true) {
          module.exports = Phonon;
      } else {
          module.exports = Phonon.Alert;
      }
  }

}(window, document, window.Phonon || {}));