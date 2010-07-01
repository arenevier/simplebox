SimpleBox is a javascript library to display modal elements in a web page. It's
basically yet another [lightbox-clone][1]. It can be used to display any html
content in a modal box. It can work with images, but also with videos, forms,
etc.

It uses prototype (minimal version: 1.7), and **does not need** script.aculo.us.

When modal box is shown, it's automatically centered vertically. You can use
css top and bottom margins if you want to modify this position. If you want to
center the box horizontally, you need to manage that yourself with css.

You can personalize background opacity and methods used to close lightbox with
argument options. You can also set callback functions called when lightbox is
shown/hidden.

[1]: http://planetozh.com/projects/lightbox-clones/
