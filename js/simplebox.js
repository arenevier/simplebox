/* Copyright (c) 2010-2023 Arnaud Renevier, Inc, published under the modified BSD
 * license. */

class SimpleBox {
  options = null;
  // when using onescapekey, we need to track other opened boxes, so a
  // kepress event can trigger close for the uppermost simplebox only
  shownOver = 0;

  /*
   * elt: element to wrap in a lightbox.
   * options: configuration object. possible properties are:
   *       opacity: background opacity when lightbox is shown (default is "0.3")
   *       closeMethods: an array containing list of methods used to close lightbox
   *          methods can be:
   *             "onbutton" insert a close buttons inside lightbox
   *             "onouterclick" close button when clicking on the document *outside* lightbox
   *             "oninnerclick" close button when clicking on the document *inside* lightbox
   *             "onescapekey" close lightbox when pressing escape key
   *          default methods are "onbutton" and "onescapekey"
   */
  constructor(elt, options) {
    this.options = Object.assign({}, options);
    this.register(elt);
  }

  register(element) {
    element = this.identify(element);

    const root = this.createWrapper(this.options.style);
    const transparency = this.createTransparency({ opacity: this.options.opacity || "0.3" });

    const padding = this.createPadding();

    let closeMethods = {};
    if (this.options.closeMethods && Object.isArray(this.options.closeMethods) && this.options.closeMethods.length !== 0) {
      this.options.closeMethods.forEach(function(name) {
        if (["onbutton", "onouterclick", "oninnerclick", "onescapekey"].include(name.toLowerCase())) {
          this[name.toLowerCase()] = true;
        }
      });
    }
    if (Object.keys(closeMethods).length === 0) {
      closeMethods = { 'onbutton': true, 'onescapekey': true }; // default values
    }

    if (closeMethods.onbutton) {
      const computedStyle = document.defaultView.getComputedStyle(element, null);
      const close = this.createCloseButton({
        marginTop: (2 - (parseFloat(computedStyle.paddingTop) || 0)).toString() + 'px',
        marginRight: (2 - (parseFloat(computedStyle.paddingRight) || 0)).toString() + 'px',
      });

      close.addEventListener("click", () => {
        this.hide();
      });
      element.insertBefore(close, element.firstChild);
    }

    if (closeMethods.onescapekey) {
      document.addEventListener("keyup", (evt) => { // we use keydown because keyup does not work in opera
        if (evt.key === "Escape" && this.rootVisible()) { // escape key closes lightbox
          if (this.shownOver <= 0) {
            this.hide();
          }
        }
      });
      document.addEventListener('simplebox:shown', (evt) => {
        if (this.rootVisible() && evt.detail !== this) {
          this.shownOver++;
        }
      });
      document.addEventListener('simplebox:hidden', (evt) => {
        if (this.rootVisible() && evt.detail !== this) {
          this.shownOver--;
        }
      });
    }

    if (closeMethods.onouterclick || closeMethods.oninnerclick) {
      root.addEventListener("click", (evt) => {
        if (closeMethods.onouterclick && closeMethods.oninnerclick) {
          this.hide();
          return;
        }
                                                    // evt.target is a descendant of element
        const innerClick = (evt.target === element || (evt.target.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_CONTAINS));

        if (closeMethods.oninnerclick && innerClick) {
          this.hide();
        } else if (closeMethods.onouterclick && (!innerClick)) {
          this.hide();
        }
      });
    }

    element.blur();
    if (element.parentNode) {
      element.parentNode.replaceChild(root, element);
    }

    root.appendChild(transparency)
    root.appendChild(padding)
    root.appendChild(element)
    root.style.display = "none";

    this.root = root;
    this.transparency = transparency;
    this.element = element;
    this.padding = padding;
  }

  identify(element) {
    if (element instanceof Element) {
      return element;
    }
    return document.querySelector(element);
  }

  show() {
    if (this.root && !(this.rootVisible())) {
      this.root.style.display = "block";
      const availableHeight = document.documentElement.clientHeight;
      this.transparency.style.height = availableHeight;
      const elementHeight = this.element.offsetHeight;
      // update height because element height and viewport height may have changed
      this.padding.style.height = ((availableHeight - elementHeight) / 2).toString() + 'px';
      const customEvent = new CustomEvent('simplebox:show', { detail: this });
      document.dispatchEvent(customEvent);
    }
    this.shownOver = 0;
  }

  hide() {
    if (this.root && this.rootVisible()) {
      this.root.blur();
      this.root.style.display = "none";
      const customEvent = new CustomEvent('simplebox:show', { detail: this });
      document.dispatchEvent(customEvent);
    }
  }

  createWrapper(aStyle) {
    const style = Object.assign({ // default wrapper style
      position: "absolute",
      top: "0px",
      left: "0px",
      width: "100%",
      height: "100%",
      zIndex: "99999"
    }, aStyle);
    return this.createElementWithStyle("div", style);
  }

  createTransparency(aStyle) {
    const style = Object.assign({ // default transparency style
      zIndex: "-1",
      position: "absolute",
      top: "0px",
      left: "0px",
      right: "0px",
      bottom: "0px",
      width: "100%",
      height: "100%",
      backgroundColor: "#888",
      opacity: "0.3"
    }, aStyle);
    style.filter = 'alpha(opacity = ' + (parseFloat(style.opacity) * 100).toString() + ')';
    return this.createElementWithStyle("div", style);
  }

  createElementWithStyle(aTagName, aStyle) {
    const element = document.createElement(aTagName);
    Object.keys(aStyle).forEach(function(key) {
      element.style[key] = aStyle[key];
    });
    return element;
  }

  createPadding(aStyle) {
    const style = Object.assign({ // default padding style
      width: "100%",
      height: "50%"
    }, aStyle);
    return this.createElementWithStyle("div", style);
  }

  createCloseButton(aStyle) {
    const style = Object.assign({ // default close button style
      'float': "right",
      margin: "2px",
      fontWeight: "bold",
      padding: "0px"
    }, aStyle);

    const imgsrc = this.options.closeBtnSrc || "icons/close.png";
    const btn = this.createElementWithStyle("input", style);
    btn.type = "image";
    btn.src = imgsrc;
    btn.alt = 'X';
    return btn;
  }

  rootVisible() {
    return this.root.style.display != 'none';
  }

}
