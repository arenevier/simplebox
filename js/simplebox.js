/* Copyright (c) 2010 Arnaud Renevier, Inc, published under the modified BSD
 * license. */

var SimpleBox = Class.create();
SimpleBox.prototype = {
    options: {},
    root: null,

    /*
     * elt: element to wrap in a lightbox.
     * options: configuration object. possible properties are:
     *       opacity: background opacity when lightbox is shown (default is "0.3")
     *       showCallback:      function to call after lightbox was shown
     *       hideCallback:      function to call after lightbox was hidden
     *       closeMethods: an array containing list of methods used to close lightbox
     *          methods can be:
     *             "onbutton" insert a close buttons inside lightbox
     *             "onouterclick" close button when clicking on the document *outside* lightbox
     *             "oninnerclick" close button when clicking on the document *inside* lightbox
     *             "onescapekey" close lightbox when pressing escape key
     *          default methods are "onbutton" and "onescapekey"
     */
    initialize: function(elt, options) {
        this.options = Object.extend(this.options, options);
        this.register(elt);
    },

    register: function(element) {
        element = $(element);

        root = this.createWrapper();
        var transparency = this.createTransparency({opacity: this.options.opacity || "0.3"});

        var padding = this.createPadding();

        var closeMethods = {};
        if (this.options.closeMethods && Object.isArray(this.options.closeMethods) && this.options.closeMethods.length !== 0) {
            this.options.closeMethods = this.options.closeMethods.invoke('toLowerCase');
            this.options.closeMethods.each(function(name) {
                if (["onbutton", "onouterclick", "oninnerclick", "onescapekey"].include(name.toLowerCase())) {
                    this[name.toLowerCase()] = true;
                }
            }, closeMethods);
        }
        if (Object.keys(closeMethods).length === 0) {
            closeMethods = { 'onbutton': true, 'onescapekey': true }; // default values
        }

        if (closeMethods.onbutton) {
            var close = this.createCloseButton({
                marginTop: (2 - element.measure('padding-top')).toString() + 'px',
                marginRight: (2 - element.measure('padding-right')).toString() + 'px'
            });

            close.observe("click", function() {
                this.hide();
            }.bindAsEventListener(this));
            element.insert({top: close});
        }

        if (closeMethods.onescapekey) {
            document.observe("keydown", function(evt) { // we use keydown because keyup does not work in opera
                if (evt.keyCode == 27 && this.root.visible()) { // escape key closes lightbox
                    this.hide();
                }
            }.bindAsEventListener(this));
        }

        if (closeMethods.onouterclick || closeMethods.oninnerclick) {
            root.observe("click", function(evt) {
                if (closeMethods.onouterclick && closeMethods.oninnerclick) {
                    this.hide();
                    return;
                }
                var innerClick = (evt.target === element || evt.target.descendantOf(element));
                if (closeMethods.oninnerclick && innerClick) {
                    this.hide();
                } else if (closeMethods.onouterclick && (!innerClick)) {
                    this.hide();
                }
            }.bindAsEventListener(this));
        }

        element.blur();
        if (element.parentNode) {
            element.parentNode.replaceChild(root, element);
        }
        root.insert(transparency).insert(padding).insert(element).hide();

        this.root = root;
        this.element = element;
        this.padding = padding;
    },

    show: function() {
        if (this.root && !(this.root.visible())) {
            this.root.show();
            var availableHeight = document.viewport.getHeight();
            var elementHeight = this.element.measure('border-box-height');
            this.padding.style.height = ((availableHeight - elementHeight) / 2).toString() + 'px';
            // update height because element height and viewport height may have changed
            if (typeof this.options.showCallback == "function") {
                this.options.showCallback.apply();
            }
        }
    },

    hide: function() {
        if (this.root && this.root.visible()) {
            this.root.blur();
            this.root.hide();
            if (typeof this.options.hideCallback == "function") {
                this.options.hideCallback.apply();
            }
        }
    },

    createWrapper: function (aStyle) {
        var style =  { // default wrapper style
            position: "absolute",
            top: "0px",
            left: "0px",
            width: "100%",
            height: "100%",
            zIndex: "99999"
        };
        Object.extend(style, aStyle);
        return new Element("div").setStyle(style);
    },

    createTransparency: function (aStyle) {
        var style =  { // default transparency style
            zIndex: "-1",
            position: "fixed",
            top: "0px",
            left: "0px",
            right: "0px",
            bottom: "0px",
            width: "100%",
            height: "100%",
            backgroundColor: "#888",
            opacity: "0.3"
        };
        Object.extend(style, aStyle);
        style.filter = 'alpha(opacity = ' + (parseFloat(style.opacity) * 100).toString() + ')';
        return new Element("div").setStyle(style);
    },

    createPadding: function (aStyle) {
        var style = { // default padding style
            width: "100%",
            height: "50%"
        };
        Object.extend(style, aStyle);
        return new Element("div").setStyle(style);
    },

    createCloseButton: function(aStyle) {
        var style = { // default close button style
            float: "right",
            margin: "2px",
            fontWeight: "bold",
            padding: "0px"
        };
        Object.extend(style, aStyle);

        var imgsrc = this.options.closeBtnSrc || "icons/cancel.png";
        return new Element("input", { type: "image", src: imgsrc, alt: "X"}).setStyle(style);
    }

};
