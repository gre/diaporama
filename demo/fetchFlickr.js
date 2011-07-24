// Create dynamically a new method `slider.fetchFlickr` in Slider.
// It takes an `options` in which you can override default flickr options.
// Don't forget to set your own API key.
slider.fetchFlickr = function(options) {
  // Call the fetchJson function with args (**url**, **params**, **transformer**)
  this.fetchJson(
  // url
  // ---
  // Using the flickr REST url API
  'http://www.flickr.com/services/rest/?jsoncallback=?', 
  // params
  // ------
  // Override some default flickr options with the `options` arg of `fetchFlickr`.
  // These options will be given when requesting the Flickr API.
  $.extend({
    method: 'flickr.photos.getRecent',
    per_page: 10,
    format: 'json',
    api_key: 'be902d7f912ea43230412619cb9abd52' // Your API key
  }, options), 
  // transformer
  // --------------------
  // transforming Flickr JSON result to a `setPhotos` compatible JSON.
  // See [slider.setPhotos](http://demo.greweb.fr/slider/docs/slider.html#section-18) for the format description.
  
    // `map` is the perfect function to use to transform datas.
    // Changing the `json.photos.photo` array into an array of *setPhotos* compatible JSON.
  function(json){
    return $.map(json.photos.photo, function(photo){
      return {
        link: 'http://www.flickr.com/photos/'+photo.owner+'/'+photo.id,
        src: 'http://farm'+photo.farm+'.static.flickr.com/'+
            photo.server+'/'+photo.id+'_'+photo.secret+'_z.jpg',
        name: photo.title.substring(0,20)
      }
    });
  });
  
  // Make `fetchFlickr` chainable
  return this;
}
