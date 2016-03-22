/**
 * jQuery Confirm dialog
 * ---
 * A simple solution for confirm dialouge of RUTEN
 */
;
// object create polyfill
if(typeof Object.create != 'function') {
  Object.create = (function() {
    var Temp = function() {};
    return function(prototype) {
      if(arguments.length > 1) {
        throw Error('Second argument not supported');
      }
      if(prototype !== Object(prototype) && prototype !== null) {
        throw new TypeError('Argument must be an object or null');
      }
      if(prototype === null) {
        throw Error('null [[Prototype]] not supported');
      }
      Temp.prototype = prototype;
      var result = new Temp();
      Temp.prototype = null;
      return result;
    };
  })();
}

(function($, window, document, undefined) {

  var TEMPLATE_STRING = ['<div class="{{prefix}}-modal" data-modal-type="{{type}}">',
    '  <div class="{{prefix}}-container">',
    '    <div class="{{prefix}}-title">{{title}}</div>',
    '    <div class="{{prefix}}-body">',
    '      <div class="{{prefix}}-content">',
    '        <div>{{body}}</div>',
    '      </div>',
    '    </div>',
    '    <div class="{{prefix}}-footer">',
    '      <button class="{{prefix}}-btn {{prefix}}-btn-confirm" data-option="confirm">{{confirmText}}</button>',
    '      <button class="{{prefix}}-btn {{prefix}}-btn-cancel" data-option="cancel">{{cancelText}}</button>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join("");

  var idle = function() {
    return true;
  };

  var $body = $('body');

  function whichAnimationEvent() {
    var t, el = document.createElement('div'),
      animations = {
        'animation': 'animationend',
        'OAnimation': 'oAnimationEnd',
        'MozAnimation': 'animationend',
        'WebkitAnimation': 'webkitAnimationEnd'
      };

    for(t in animations) {
      if(animations.hasOwnProperty(t) && el.style[t] !== undefined) {
        return animations[t];
      }
    }
  }

  var prefixedAnimationEvent = whichAnimationEvent();
  var defaultConfig = {
    onBeforeShow: idle,
    onBeforeClose: idle,
    onConfirm: idle,
    onCancel: idle,
    classPrefix: 'modal',
    modalType: '',
    modalTitle: '',
    modalContent: '',
    modalConfirmText: 'Confirm',
    modalCancelText: 'Cancel',
    overlay: 0.3,
    overlayZIndex: 1000
  };

  $.rtmModal = function(config) {
    var thisConfig = processConfig(config);
    var $modal = _generateHTML(thisConfig);
    $modal.appendTo($body).rtmModal(thisConfig);
    return $modal;
  };

  $.fn.rtmModal = function(config) {
    return this.each(function() {
      var $modal = $(this);
      var thisModal = $modal.data('rtmModal');
      var thisConfig, thisModal;

      if(thisModal) {
        thisModal[config]();
      } else {
        thisConfig = processConfig(config);
        thisModal = ModalFactory.createModal(thisConfig);
        $modal.data('rtmModal', thisModal);
        thisModal.init($modal);
      }
    });
  };

  function processConfig(config) {
    thisConfig = $.extend({}, defaultConfig, config);
    return thisConfig;
  }

  function createAnimationEndCallback(className, $d) {
    return function() {
      this.$modal.show().one(prefixedAnimationEvent, function() {
        $d.resolve();
      }).addClass(className)[0].offset;
      return true;
    };
  }

  function deferredDispatch(fn, $d) {
    var result;
    if(typeof fn === 'function') {
      result = fn();
      result ? ($d.resolve()) : ($d.reject());
    } else if(typeof fn === 'string') {
      fn = createAnimationEndCallback(fn, $d);
      fn.call(this);
    }
  }

  function getOverlay(zIndex) {
    if($('#rtm_overlay').length) {
      return $('#rtm_overlay');
    } else {
      return $('<div id=rtm_overlay></div>').css({
        'position': 'fixed',
        'top': 0,
        'right': 0,
        'bottom': 0,
        'left': 0,
        'z-index': 1040,
        'background-color': '#000',
        'opacity': 0,
        'z-index': zIndex
      }).appendTo($body);
    }
  }

  var Modal = {
    create: function(config) {
      var instance = Object.create(this);
      instance.config = config;
      return instance;
    },

    init: function($modal) {
      var self = this,
        onBeforeShow, onBeforeClose;
      self.$modal = $modal;
      onBeforeShow = self.config.onBeforeShow;
      self.onBeforeShow = function($d) {
        deferredDispatch.call(self, onBeforeShow, $d);
        return $d;
      };
      onBeforeClose = self.config.onBeforeClose;
      self.onBeforeClose = function($d) {
        deferredDispatch.call(self, onBeforeClose, $d);
        return $d;
      };

      self.bindModal();
    },

    show: function() {
      var self = this;
      var $d = $.Deferred();
      self.showOverlay();
      self.onBeforeShow($d).always(function() {
        self.showModal();
      });
    },

    hide: function() {
      var self = this;
      var $d = $.Deferred();
      self.onBeforeClose($d).always(function() {
        self.hideModal();
      });
      self.hideOverlay();
    },

    showOverlay: function() {
      this.$overlay = getOverlay(this.config.overlayZIndex);
      this.$overlay.animate({
        opacity: this.config.overlay
      }, 200);
      this.$modal.css('z-index', this.config.overlayZIndex+1);
    },

    hideOverlay: function() {
      var self = this;
      self.$overlay.animate({
        opacity: 0
      }, 200, 'swing', function() {
        self.$overlay.remove();
      });
    },

    showModal: function() {
      this.$modal.show();
    },

    hideModal: function() {
      this.$modal.hide();
    },

    bindModal: function() {},

    getModal: function() {
      return this.$modal;
    }
  };

  var ConfirmModal = Object.create(Modal);

  ConfirmModal.bindModal = function() {
    var self = this;
    self.$modal.find('[data-option]').one('click', function() {
      var choice = $(this).data('option');
      if(choice === 'confirm') {
        self.config.onConfirm(true);
      } else {
        self.config.onCancel(false);
      }
      self.hide();
    });
  };

  ConfirmModal.showModal = function() {
    this.bindModal();
    Modal.showModal.call(this);
  };

  var AlertModal = Object.create(Modal);

  AlertModal.bindModal = function() {
    var self = this;
    self.$modal.find('[data-option]').one('click', function() {
      self.config.onConfirm(true);
      self.hide();
    });
  };

  AlertModal.showModal = ConfirmModal.showModal;

  var ModalFactory = {
    createModal: function(config) {
      switch(config.modalType) {
        case "alert":
          return AlertModal.create(config);
          break;
        case "confirm":
          return ConfirmModal.create(config);
          break;
        default:
          return Modal.create(config);
      }
    }
  };

  // a simple template
  var _generateHTML = function(option) {
    var data = {
      prefix: option.classPrefix,
      type: option.modalType,
      title: _htmlEntities(option.modalTitle),
      body: option.modalContent,
      confirmText: _htmlEntities(option.modalConfirmText),
      cancelText: _htmlEntities(option.modalCancelText)
    };

    return $(TEMPLATE_STRING.replace(/\{\{(\w+)\}\}/g, function(match, m1) {
      return data[m1];
    }));
  };

  var _htmlEntities = function(rawStr) {
    return rawStr.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
      return '&#' + i.charCodeAt(0) + ';';
    });
  };

})(jQuery, window, document);
