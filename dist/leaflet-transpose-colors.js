/*
 * L.TileLayer.TransposeColors is a plugin to transpose one hexadecimal color from a tile layer to another one.
 * Can easily be used to set a custom color for the ocean for example
 * (c) 2014, Damien Imberdis
 * 
 * Usage: pass an array of objects with hexadecimal color values of the form {from: '#xxxxxx', to: '#xxxxxx' } as the transposeColors Tile Layer new option
 * Example: L.TileLayer.transposeColors(url, { ..., transposeColors: [{from: '#000000', to: '#0000ff', rgbWindow: 5, alpha: 100}, ...] }
 */

(function (window, document, undefined) {
    "use strict";
  
  L.TileLayer.TransposeColors = {};
  L.TileLayer.TransposeColors.version = '0.0.1';
  
  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  };

  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  };

  function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
  };
  
  L.TileLayer.TransposeColors.factory = L.TileLayer.extend({
	options: {
	  enableCanvas: true,
	  transposeColors: []
	},
		
	initialize: function (url, options) {
	  var canvasEl = document.createElement('canvas');
	  if( !(canvasEl.getContext && canvasEl.getContext('2d')) ) {
	    options.enableCanvas = false;
	  }

	  L.TileLayer.prototype.initialize.call(this, url, options);
	},

	_loadTile: function (tile, tilePoint) {
	  tile.setAttribute('crossorigin', 'anonymous');
	  L.TileLayer.prototype._loadTile.call(this, tile, tilePoint);
	},

	_tileOnLoad: function () {
	  if (this._layer.options.enableCanvas && !this.canvasContext) {
		var canvas = document.createElement("canvas");
		canvas.width = canvas.height = this._layer.options.tileSize;
		this.canvasContext = canvas.getContext("2d");
	  }
	  var ctx = this.canvasContext;

	  if (ctx) {
	    this.onload  = null; // to prevent an infinite loop
		ctx.drawImage(this, 0, 0);
		var imgd = ctx.getImageData(0, 0, this._layer.options.tileSize, this._layer.options.tileSize);
		var pix = imgd.data;

		for (var i = 0, n = pix.length; i < n; i += 4) {
		  var current_color = rgbToHex(pix[i], pix[i + 1], pix[i + 2]);
		  var transpose;
          
          for (var j = 0; j < this._layer.options.transposeColors.length; j++) {
          	var rgb_window = this._layer.options.transposeColors[j].rgbWindow;
          	var color_to_compare = hexToRgb(this._layer.options.transposeColors[j].from)

            if( (pix[i] >= (color_to_compare.r - rgb_window) && pix[i] <= (color_to_compare.r + rgb_window)) && 
                (pix[i + 1] >= (color_to_compare.g - rgb_window) && pix[i + 1] <= (color_to_compare.g + rgb_window)) &&
                (pix[i + 2] >= (color_to_compare.b - rgb_window) && pix[i + 2] <= (color_to_compare.b + rgb_window)) ) {
            
              var new_color = hexToRgb(this._layer.options.transposeColors[j].to);	
              var new_alpha = this._layer.options.transposeColors[j].alpha;
              pix[i] = new_color.r;
		      pix[i + 1] = new_color.g;
		      pix[i + 2] = new_color.b;
		      if(new_alpha) { pix[i + 3] = new_alpha; }
            }
          }
		}
		ctx.putImageData(imgd, 0, 0);
		this.removeAttribute("crossorigin");
		this.src = ctx.canvas.toDataURL();
	  }

	  L.TileLayer.prototype._tileOnLoad.call(this);
    }
  });

  L.TileLayer.transposeColors = function (url, options) {
    return new L.TileLayer.TransposeColors.factory(url, options);
  };
}(this, document));