jQuery(function($){
    var slider = window.slider = new FlickrSlider($('#demo'));

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
        slider.setTransition($(this).val());
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
