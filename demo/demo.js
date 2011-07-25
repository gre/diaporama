jQuery(function($){
    var slider = window.slider = new Slider($('#demo'));
    
    // Extends the slider with "fetchFlickr"
    slider.fetchFlickr = function(options) {
      this.fetchJson('http://www.flickr.com/services/rest/?jsoncallback=?', $.extend({
        method: 'flickr.photos.getRecent',
        per_page: 10,
        format: 'json',
        api_key: 'be902d7f912ea43230412619cb9abd52'
      }, options), function(json){ 
        return $.map(json.photos.photo, function(photo){
          return {
            link: 'http://www.flickr.com/photos/'+photo.owner+'/'+photo.id,
            src: 'http://farm'+photo.farm+'.static.flickr.com/'+
                photo.server+'/'+photo.id+'_'+photo.secret+'_z.jpg',
            name: photo.title.substring(0,20)
          }
        });
      });
      return this;
    }
    
    $('#method_search').change(function(e){
        $('#search').focus();
    });
    $('#search').focus(function(){
        $('#method_search:not(:checked)').attr('checked', 'checked');
    });
    $('#themes').change(function(){
        slider.setTheme($(this).val());
    }).change();
    $('#transitions').change(function(){
        var transition = $(this).val();
        slider.setTransition('transition-clear');
        setTimeout(function(){ slider.setTransition(transition) }, 50);
    }).change();
    $('#options').submit(function(e){
        e.preventDefault();
        if($('#flickr_enabled').is(':checked')) {
            var opt = { per_page: $('#options_nb').val() };
            var search = $('#search').val();
            if(!search) $('#method_recent').attr('checked', 'checked');
            if($('#method_search').is(':checked')) {
                opt = $.extend(opt, {
                   method: 'flickr.photos.search',
                   text: search
                });
            }
            slider.fetchFlickr(opt);
            slider.setSize('640px', '430px');
        }
        else {
            slider.fetchJson('photos_pixar.json');
            slider.setSize('640px', '250px');
        }
    }).submit();
    $('#flickr_enabled').change(function(){
        if($(this).is(':checked')) {
            $('#flickr_options').addClass('enabled');
        }
        else {
            $('#flickr_options').removeClass('enabled');
        }
        $('#options').submit();
    }).change();
});
