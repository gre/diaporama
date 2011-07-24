// A Simple flickr slider

(function($){
// Slider template
// ---------------
$.template('slider', '<div class="slider">'+
  '<div class="loader"><span class="spinner"></span> '+
  'Loading photos... '+
  '(<span class="percent">0</span>%)</div>'+
  '<div class="slide-images">'+
  '{{each(i, slide) slides}}'+
    '<figure class="slide-image">'+
    '{{if slide.link}}<a href="${slide.link}" target="_blank">{{/if}}'+
      '<img src="${slide.src}">'+
      '<figcaption>${slide.name}</figcaption>'+
    '{{if slide.link}}</a>{{/if}}'+
    '</figure>'+
  '{{/each}}'+
  '</div>'+
  '<div class="options">'+
  '<a class="prevSlide" href="javascript:;">prev</a>'+
  '<span class="slide-pager">'+
    '{{each slides}}<a href="javascript:;">${$index+1}</a>{{/each}}'+
  '</span>'+
  '<a class="nextSlide" href="javascript:;">next</a>'+
  '</div>'+
'</div>');


// Slider - a lightweight slider
// -----------------------------
// Constructor : init container node and current slide number
this.Slider = function(container) {
  var self = this;
  self.container = $(container);
  self.current = 0;
  self.lastHumanNav = 0;
  self.duration = 5000;
  
  // Go to slide number `num` : update both DOM and this.current
  self.slide = function(num) {
    // num must be between 0 and nbslides-1
    num = Math.max(0, Math.min(num, self.slides.size()-1));
    if(self.node) {
      // Move current class in **slides**
      self.slides.eq(self.current).removeClass('current');
      self.slides.eq(num).addClass('current');
      // Move current class in **pages**
      self.pages.eq(self.current).removeClass('current');
      self.pages.eq(num).addClass('current');
    }
    // Update current slider number
    self.current = num;
    return self;
  }

  // Go to circular next slide (will call `slide`)
  self.next = function() {
    var next = self.current + 1;
    if(next >= self.slides.size()) next = 0;
    self.slide(next);
  }

  // Go to circular previous slide (will call `slide`)
  self.prev = function() {
    var prev = self.current - 1;
    if(prev < 0) prev = self.slides.size() - 1;
    self.slide(prev);
  }

  // Change the duration between each slide
  self.setDuration = function(duration) {
    self.duration = duration&&duration>0 ? duration : 5000;
    return self;
  }

  // Change the slider transition CSS class
  self.setTransition = function(transition) {
    if(self.node) {
      self.transition && self.node.removeClass(self.transition);
      transition && self.node.addClass(transition);
    }
    self.transition = transition;
    return self;
  }

  // Change the slider theme CSS class
  self.setTheme = function(theme) {
    if(self.node) {
      self.theme && self.node.removeClass(self.theme);
      theme && self.node.addClass(theme);
    }
    self.theme = theme;
    return self;
  }

  // set slider size
  self.setSize = function(w, h) {
    self.w = w;
    self.h = h;
    if(self.node) {
      self.node.width(w);
      self.node.find('.slide-image').width(w);
      self.node.find('.slide-images, .slider-image').height(h);
    }
    return self;
  }

  // Fetch photos with a JSON providing its `url`.
  // If `options` is defined, passing it in request params.
  // If `transformer` is defined, using it to transform the json
  // to a compatible json to pass to `Slider.setPhotos`.
  self.fetchJson = function(url, options, transformer) {
    var params = $.extend({}, options);
    if(!transformer) transformer = function(json){ return json; };
    self.container.empty();
    $.getJSON(url, params, function(json){ self.setPhotos(transformer(json)); });
    return self;
  }

  // Sync slider data to DOM
  self._sync = function() {
    self.setTransition(self.transition);
    self.setTheme(self.theme || "theme-dark");
    self.setSize(self.w||'640px', self.h||'430px');
    self.slides && self.slide(self.current||0);
  }

  // `slides` : format: array of { src, name, link (optional) } 
  self.setPhotos = function(slides) {  
    // Templating and appending to DOM
    self.node = $.tmpl('slider', { slides: slides }).addClass('loading');
    self.container.empty().append(self.node);
    self.current = 0;
    self._sync();

    // Loading all images before showing the slider
    var nbLoad = 0;
    var imgs = self.node.find('.slide-image img').bind('load', function(){
      var total = imgs.size();
      if (++nbLoad == total) {
        self.node.removeClass('loading');
        self.start();
      }
      // Update loader progression (in percent)
      self.node.find('.loader .percent').text( Math.floor(100*nbLoad/total) );
    });
    if(imgs.size()==0) {
      self.node.find('.loader').text("No photo");
    }
    return self;
  }

  // Start the slider
  self.start = function() {
    self._sync();

    self.slides = self.node.find('.slide-image');
    self.pages = self.node.find('.slide-pager a');
    
    self._bind();
    
    // init classes for current slide
    self.slides.removeClass('current').eq(self.current).addClass('current');
    self.pages.removeClass('current').eq(self.current).addClass('current');
    return self;
  }
  
  // Bind slider DOM events for navigation
  self._bind = function() {
    self.node.find('.prevSlide').click(function(){ self.prev() });
    self.node.find('.nextSlide').click(function(){ self.next() });
    self.node.find('.slide-pager a').each(function(i){
      $(this).click(function(){
        self.slide(i);
      });
    });

    var now = function(){ return  new Date().getTime(); }
    self.node.find('.options a').click(function(){
      self.lastHumanNav = now();
    });
    if(!self.timeout) {
      var loop = function() {
        if(now()-self.lastHumanNav > 2000) self.next();
        self.timeout = setTimeout(loop, self.duration);
      }
      self.timeout = setTimeout(loop, self.duration);
    }
    return self;
  }

}

}(jQuery));

