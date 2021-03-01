// Trait Category pie chart settings
// var tc_height = 260;
// var tc_width = 300;
// var tc_margin = 10;
// var tc_radius = Math.min(tc_width, tc_height - tc_margin) / 2;
// var tc_arc = get_d3_arc(tc_radius, 0.55);
// var tc_arcOver = get_d3_arc(tc_radius, 0.53, 1.02);

// var anc_colours = {
//   'AFR': '#FFFF33', // yellow
//   'AMR': '#E41A1C', // red
//   'EAS': '#4DAF4A', // green
//   'EUR': '#377EB8', // blue
//   'SAS': '#984EA3', // purple
//   'MA' : '#FF7F00', // orange
//   'MAE': '#A6CEE3', // light blue   '#1f4869',//'#F781BF', // pink
//   'OTH': '#999', // grey
//   'NR' : '#BBB' // lighter grey
// };
// var anc_labels = {
//   'AFR': 'African',
//   'AMR': 'American',
//   'EAS': 'East Asian',
//   'EUR': 'European',
//   'SAS': 'South Asian',
//   'MA' : 'Multi-ancestry (excluding European)',
//   'MAE': 'Multi-ancestry (including European)',
//   'OTH': 'Other',
//   'NR' : 'Not Reported'
// };
var anc_types = {
  'gwas': 'V',
  'dev' : 'D',
  'eval': 'E'
};

var single_anc_svg = '<g transform="translate(20,20)"><path fill="####COLOUR####" d="M1.2246467991473533e-15,-20A20,20,0,1,1,-1.2246467991473533e-15,20A20,20,0,1,1,1.2246467991473533e-15,-20M-1.1790629835294509e-14,-11A11,11,0,1,0,1.1790629835294509e-14,11A11,11,0,1,0,-1.1790629835294509e-14,-11Z"></path><text class="pie_text" dy=".35em">####TYPE####</text></g>';

var data_toggle_table = 'table[data-toggle="table"]';

$(document).ready(function() {

    // Fix issue with internal links because of the sticky header
    function offsetAnchor() {
      if(location.hash.length !== 0) {
        window.scrollTo(window.scrollX, window.scrollY - 95);
      }
    }
    // This will capture hash changes while on the page
    $(window).on("hashchange",offsetAnchor);
    // This is here so that when you enter the page with a hash,
    // it can provide the offset in that case too. Having a timeout
    // seems necessary to allow the browser to jump to the anchor first.
    window.setTimeout(offsetAnchor, 0.1);

    //$("td>div").tooltip({container:'body'});
    //$("td").tooltip({container:'body'});

    // Shorten content having long text
    shorten_displayed_content();

    $('body').on("click", 'span.morelink', function(){
        if($(this).hasClass("link_less")) {
          $(this).html(moretext);
        } else if ($(this).hasClass("link_more")){
          $(this).html(lesstext);
        }
        $(this).toggleClass("link_less link_more");
        // Show/hide "..." characters
        $(this).parent().find('.moreellipses').toggle();
        // Show/hide the rest of the text
        $(this).parent().find('.morecontent').toggle();
        return false;
    });


    // Add external link icon and taget blank for external links
    format_table_content();


    // Draw ancestry charts
    if ($('.ancestry_chart').length) {
      var anc_width = 40;
      var anc_height = 40;

      anc_colours = {};
      $('.filter_ancestry_box').each(function() {
        var key = $(this).data('key');
        var colour = $(this).css('background-color');
        anc_colours[key] = colour;
      });

      // Pre-generate chart SVG code for single ancestry category
      single_anc_svgs = {};
      for (anc_sym in anc_colours) {
        var colour = anc_colours[anc_sym];
        for (type in anc_types) {
          var type_letter = anc_types[type];
          var key = anc_sym+"_"+type;
          var svg = single_anc_svg;
          svg = svg.replace('####COLOUR####',colour);
          svg = svg.replace('####TYPE####',type_letter);
          single_anc_svgs[key] = svg;
        }
      }

      $('.ancestry_chart').each(function() {
        var id = $(this).attr('data-id');
        var type = $(this).attr('data-type');
        var data_chart = JSON.parse($(this).attr('data-chart'));

        if (data_chart.length == 1){
          var key = data_chart[0][0]+'_'+type;
          if (single_anc_svgs[key]) {
            $('#'+id).attr("width",anc_width);
            $('#'+id).attr("height",anc_height);
            $('#'+id).html(single_anc_svgs[key]);
            return;
          }
        }

        //console.log(id);
        var pgs_samples_chart = new PGSPieChartTiny(id,data_chart,anc_width,anc_height,0);
        pgs_samples_chart.draw_piechart();
        pgs_samples_chart.add_text(anc_types[type]);
      });

      // $('.ancestry_chart_container').each(function () {
      //   $(this).show();
      //   //$(this).css('display','flex');
      // });
    }


    // EMBL-EBI Data Protection banner
    var localFrameworkVersion = '1.3'; // 1.1 or 1.2 or compliance or other
    // if you select compliance or other we will add some helpful
    // CSS styling, but you may need to add some CSS yourself
    var newDataProtectionNotificationBanner = document.createElement('script');
    newDataProtectionNotificationBanner.src = 'https://ebi.emblstatic.net/web_guidelines/EBI-Framework/v'+localFrameworkVersion+'/js/ebi-global-includes/script/5_ebiFrameworkNotificationBanner.js?legacyRequest='+localFrameworkVersion;
    document.head.appendChild(newDataProtectionNotificationBanner);
    newDataProtectionNotificationBanner.onload = function() {
      ebiFrameworkRunDataProtectionBanner(localFrameworkVersion); // invoke the banner
    };


    // Button toggle
    $('.toggle_btn').click(function() {
      pgs_toggle_btn($(this));
    });
    // Button toggle within an HTML table
    $(data_toggle_table).on("click", '.toggle_table_btn', function(){
      pgs_toggle_btn($(this));
    });

    // Run the "post processing" after a manual sorting
    $(data_toggle_table).on("click", ".sortable", function(){
      format_table_content(10);
    });


    // Remove pagination text if there is no pagination links
    $('.fixed-table-pagination').each(function(index) {
      var page_list = $( this ).find('.page-list');
      if (page_list.length == 0) {
        $( this ).remove();
      }
      else {
        if (page_list.css('display') == 'none') {
          $( this ).remove();
        }
      }
    });

    // Update to the scientific notation (1x10-1 and 1e-1)
    if ($('#pgs_params').length) {
      var pgs_param = $('#pgs_params').html();
      var matches = pgs_param.match(/\d+(x10|e)(-?\d+)/);
      if (matches && matches.length > 2) {
        for(var i=2; i<matches.length; i++) {
          if (matches[i] == 'x10' || matches[i] == 'e') {
            continue;
          }
          var chars = (matches[i-1] == 'x10') ? 'x10' : 'e';
          var pgs_param_sup = pgs_param.replace(chars+matches[i], chars+"<sup>"+matches[i]+"</sup>");
          $('#pgs_params').html(pgs_param_sup);
          pgs_param = pgs_param_sup;
        }
      }
      // Update rsquare notation (r2)
      $('#pgs_params').html(pgs_param.replace("r2", "r<sup>2</sup>"));
    }


    $('.pgs-ftp-btn').hover(function() {
      $(this).children('span').toggleClass('fa-folder fa-folder-open');
    });


    // Control on search form(s)
    $('#search_btn').click(function() {
      if ($('#q').val() && $('#q').val() != ''){
        $('#search_form').submit();
      }
    })
    $('#search_btn_2').click(function() {
      if ($('#q2').val() && $('#q2').val() != ''){
        $('#search_form_2').submit();
      }
    })

    // Load google from iframe
    $('#g_iframe').on("load", function () {
      $('#iframe_loading').removeClass('d-flex');
      $('#iframe_loading').css('display', 'none');
    });


    // Add the following code if you want the name of the file appear on select
    $(".custom-file-input").on("change", function() {
      var fileName = $(this).val().split("\\").pop();
      // Display file label
      $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
      // Check file extension
      fileExt = fileName.split("\.").pop();
      if (fileExt != 'xlsx') {
        $('#error_file_extension').show();
        $('#upload_btn').hide();
        $('#upload_arrow').hide();
        $('#upload_btn').removeAttr('type');
      }
      else {
        $('#error_file_extension').hide();
        $('#upload_btn').attr('type', 'submit');
        $('#upload_arrow').show();
        $('#upload_btn').show();
      }
    });


    // Filter to include or not children traits
    // $("#include_children").click(function() {
    //   var trait_label = '';
    //
    //   // Filter by value - not filtering
    //   if ($(this).prop('checked')) {
    //     $('#scores_table').bootstrapTable('filterBy', {});
    //     $('#performances_table').bootstrapTable('filterBy', {});
    //     $('#samples_table').bootstrapTable('filterBy', {});
    //   }
    //   // Filter by value - filter out the children terms
    //   else {
    //     // Scores
    //     trait_label = $(this).val();
    //     var default_pagination = 15;
    //     var tmp_pagination =  'All';
    //     var pgs_ids_list = [];
    //     var pgs_ids_list_link = [];
    //     var scores_table_id = '#scores_table';
    //
    //     var score_data = $(scores_table_id).bootstrapTable('getData');
    //     $.each(score_data,function(i, row) {
    //       //console.log(row['list_traits']);
    //       var traits_html = $(row['list_traits']);
    //       var traits = traits_html.children('a');
    //       for (var j = 0; j < traits.length; j++) {
    //         if (traits[j].innerHTML == trait_label) {
    //           var pgs_td = row['id'];
    //           var pgs_id = $(pgs_td).text();
    //           pgs_ids_list.push(pgs_id);
    //           pgs_ids_list_link.push(pgs_td);
    //         }
    //       }
    //     });
    //
    //     $(scores_table_id).bootstrapTable('filterBy', {
    //       id: pgs_ids_list_link
    //     });
    //
    //     // Performances & Samples
    //     var perf_table_id = '#performances_table';
    //     if ($(perf_table_id).length != 0) {
    //       var ppm_ids_list = [];
    //       var pss_ids_list = [];
    //
    //       var perf_data = $(perf_table_id).bootstrapTable('getData');
    //       $.each(perf_data,function(i, row) {
    //         //console.log(row);
    //         var pgs_td = row['score'];
    //         var pgs_id = $(pgs_td).html(); // Only take the <a> text
    //         //console.log("PGS_ID: "+pgs_id);
    //         if ($.inArray(pgs_id, pgs_ids_list) != -1) {
    //           // PPM
    //           var ppm_id = row['id'];
    //           //console.log("PPM_ID: "+ppm_td);
    //           ppm_ids_list.push(ppm_id);
    //           // PSS
    //           var pss_td = row['sampleset'];
    //           var pss_id = $(pss_td).text();
    //           pss_ids_list.push('<a id="'+pss_id+'" href="/sampleset/'+pss_id+'">'+pss_id+'</a>');
    //         }
    //       });
    //       $(perf_table_id).bootstrapTable('filterBy', {
    //          id: ppm_ids_list
    //       });
    //       $('#samples_table').bootstrapTable('filterBy', {
    //          display_sampleset: pss_ids_list
    //       });
    //     }
    //   }
    //   shorten_displayed_content();
    // });


    // if($('#ancestry_legend_content').length) {
    //   var count = 0;
    //   var entry_per_col = Math.round(Object.keys(anc_labels).length / 2);
    //
    //   var div = $('<div>');
    //   div.addClass('filter_legend');
    //   div.css('float','left');
    //
    //   var opt = $('<option>');
    //
    //   var html = '';
    //   for (key in anc_labels) {
    //     if (count == entry_per_col) {
    //       div.html(html);
    //       div.css('margin-right','1rem');
    //       $('#ancestry_legend_content').append(div);
    //       div = $('<div>');
    //       div.addClass('filter_legend');
    //       div.css('float','left');
    //       html = ''
    //       count = 0;
    //     }
    //     var label = anc_labels[key];
    //     var colour = anc_colours[key];
    //     html += '<div><span class="filter_ancestry_box" style="background-color:'+colour+'"></span> '+label+'</div>';
    //
    //     if (key != 'MA' && key != 'MAE') {
    //       var opt = $('<option>');
    //       opt.attr('value', key);
    //       opt.html(label);
    //       $('#ancestry_filter_ind').append(opt);
    //     }
    //     count += 1;
    //   }
    //   div.html(html);
    //   $('#ancestry_legend_content').append(div);
    // }

    // Filter to show/hide ancestry form
    $("#ancestry_type_list").change(function() {
      var anc = $("#ancestry_type_list option:selected").val();
      if (anc != '') {
        $("#ancestry_filter_list").parent().show();
      }
      else {
        $("#ancestry_filter_list").parent().hide();
      }
      $('#scores_table').bootstrapTable('filterBy', {});
      $('#performances_table').bootstrapTable('filterBy', {});
      $('#samples_table').bootstrapTable('filterBy', {});
    });


    // Include children filter
    $("#include_children").click(function() {
      filter_score_table();
    });
    // Ancestry Filters
    $("#ancestry_type_list").change(function() {
      filter_score_table();
    });
    $("#ancestry_filter_list").on("change", ".ancestry_filter_cb",function() {
      filter_score_table();
      console.log("Change!");
    });
    $("#ancestry_filter_ind").change(function() {
      filter_score_table();
    });


    function filter_score_table() {

      // Traits
      var trait_filter = '';
      var include_children = $("#include_children");
      if (include_children.length) {
        if (!include_children.prop('checked')) {
          trait_filter = include_children.val();
        }
      }

      // Ancestries
      var stage;
      var anc_filter = [];
      if ($("#ancestry_type_list").length) {

        stage = $("#ancestry_type_list option:selected").val();

        if (!stage) {
          reset_ancestry_form();
        }
        else {
          $(".ancestry_filter_cb").each(function () {
            if ($(this).prop("checked"))  {
              anc_filter.push($(this).val());
            }
          });
          var ind_anc = $("#ancestry_filter_ind option:selected").val();
          if (ind_anc != '') {
            anc_filter.push(ind_anc);
          }
        }
      }

      $('#scores_table').bootstrapTable('filterBy', {});
      $('#scores_eval_table').bootstrapTable('filterBy', {});
      $('#performances_table').bootstrapTable('filterBy', {});
      $('#samples_table').bootstrapTable('filterBy', {});

      console.log("Selection: "+anc_filter);


      // Filter by value
      if ((anc_filter.length != 0 && stage) || trait_filter != '') {

        var anc_filter_length = anc_filter.length;
        if (trait_filter != '') {
          anc_filter_length += 1;
        }

        // Scores
        var pgs_ids_list = [];
        var pgs_ids_list_link = {};
        var scores_table_ids_list = ['#scores_table','#scores_eval_table'];
        var ancestry_col = 'ancestries';
        var traits_col = 'list_traits';

        for (var i=0; i < scores_table_ids_list.length; i++) {
          var scores_table_id = scores_table_ids_list[i];
          if (!$(scores_table_id).length) {
            continue;
          }

          pgs_ids_list_link[scores_table_id] = [];

          var data = $(scores_table_id).bootstrapTable('getData');
          $.each(data,function(i, row) {
            var pass_filter = 0;
            // Ancestry
            if (anc_filter.length != 0 && stage) {
              var ancestry_html = $(row[ancestry_col]);
              var anc_list = ancestry_html.attr('data-anc-'+stage);
              if (!anc_list) {
                return;
              }
              anc_list = JSON.parse(anc_list);

              for (var f in anc_filter) {
                if (anc_list.includes(anc_filter[f])) {
                  pass_filter += 1;
                }
              }
            }

            // Traits
            if (trait_filter != '') {
              var traits_html = $(row['list_traits']);
              var traits = traits_html.children('a');
              for (var j = 0; j < traits.length; j++) {
                if (traits[j].innerHTML == trait_filter) {
                  pass_filter += 1;
                }
              }
            }

            // Select scores
            if (pass_filter == anc_filter_length) {
              var pgs_td = row['id'];
              var pgs_id = $(pgs_td).text().split('(')[0];
              if (!pgs_ids_list.includes(pgs_id)) {
                pgs_ids_list.push(pgs_id);
              }
              pgs_ids_list_link[scores_table_id].push(pgs_td);
            }
          });

          $(scores_table_id).bootstrapTable('filterBy', {
            id: pgs_ids_list_link[scores_table_id]
          });
        }

        // Performances & Samples
        var perf_table_id = '#performances_table';
        if ($(perf_table_id).length != 0) {
          var ppm_ids_list = [];
          var pss_ids_list = [];

          var perf_data = $(perf_table_id).bootstrapTable('getData');
          $.each(perf_data,function(i, row) {
            //console.log(row);
            var pgs_td = row['score'];
            var pgs_id = $(pgs_td).html(); // Only take the <a> text
            //console.log("PGS_ID: "+pgs_id);
            if ($.inArray(pgs_id, pgs_ids_list) != -1) {
              // PPM
              var ppm_id = row['id'];
              //console.log("PPM_ID: "+ppm_td);
              ppm_ids_list.push(ppm_id);
              // PSS
              var pss_td = row['sampleset'];
              var pss_id = $(pss_td).text();
              pss_ids_list.push('<a id="'+pss_id+'" href="/sampleset/'+pss_id+'">'+pss_id+'</a>');
            }
          });
          $(perf_table_id).bootstrapTable('filterBy', {
             id: ppm_ids_list
          });
          $('#samples_table').bootstrapTable('filterBy', {
             display_sampleset: pss_ids_list
          });
        }
      }
      setTimeout(function(){
        pgs_tooltip();
      }, 1000);
    }
});


// Wait for the rendering of the whole page (DOM + but everything else is loaded)
$(window).on('load', function() {

  // var timeout_tooltip = 1500;
  // if (navigator.userAgent.indexOf("Chrome") !== -1) {
  //   timeout_tooltip = 2500;
  // }
  setTimeout(function(){
    pgs_tooltip();
  }, 1500);

  // Add even listener
  var input = document.querySelectorAll(".form-control");
  console.log("inputs: "+input.length);
  for (var i=0; i < input.length; i++ ) {
    input[i].addEventListener('input', format_table_event);
  }

  $(data_toggle_table).each(function(){
    // Remove column search if the number of rows is too small
    var trs = $( this ).find( "tbody > tr");
    if (trs.length < 3) {
      $(this).find('.fht-cell').hide()
    }
    // Remove column search where the filtering is not relevant
    else {
      var list = ['ancestries','link_filename'];
      for (var i=0; i < list.length; i++) {
        $(this).find(`[data-field='${list[i]}'] div.fht-cell`).hide();
        $(this).find(`[data-field='${list[i]}']`).css({"vertical-align": "top"});
      }
    }
    // Alter the table display
    format_table_content(500);
  });
});


function search_validator(){
   if($('#q').val()){
      $('#search_form').submit();
      return(true);
   }
   else {
      return(false);
   }
}


function pgs_toggle_btn(el) {
  el.find('i').toggleClass("fa-plus-circle fa-minus-circle");
  id = el.attr('id');
  prefix = '#list_';
  $(prefix+id).toggle();
  if ($(prefix+id).is(":visible")) {
    fadeIn($(prefix+id));
  }
}


function reset_ancestry_form() {
  $(".ancestry_filter_cb").each(function () {
    $(this).prop('checked', false);
  });
  $('#ancestry_filter_ind option:eq(0)').prop('selected', true);
}



/*
 * Functions to (re)format data in boostrap-table cells
 */

// Function to shorten content having long text
var showChar = 100;  // How many characters are shown by default
var ellipsestext = "...";
var moretext = 'Show more';
var lesstext = 'Show less';

function shorten_displayed_content() {
  $('.more').each(function() {
      var content = $(this).html();
      if (content.length > showChar ){
        if (content.search('.moreellipses') == -1) {
          var c = content.substr(0, showChar);
          var h = content.substr(showChar, content.length - showChar);
          var html = c + '<span class="moreellipses">' + ellipsestext+ '&nbsp;</span><span class="morecontent">' + h + '</span><span class="morelink link_more">' + moretext + '</span>';
          $(this).html(html);
        }
      }
  });
}

// Add external link icon and taget blank for external links
function alter_external_links(prefix) {
  if (!prefix) {
    prefix = '';
  }
  else {
    prefix += ' '
  }
  $(prefix+'a[href^="http"]').attr('target','_blank');
  $(prefix+'a[href^="http"]').not('[class*="pgs_no_icon_link"]').addClass("external-link");
}


// Tooltip | Popover
function pgs_tooltip() {
  $('.pgs_helptip').attr('data-toggle','tooltip').attr('data-placement','bottom').attr('data-delay','800');
  $('.pgs_helpover').attr('data-toggle','popover').attr('data-placement','right');

  $('[data-toggle="tooltip"]').tooltip();
  $('[data-toggle="popover"]').popover();
}

// Reformat the table content (links, shortened text, tooltips)
function format_table_content(timeout) {
  if (!timeout) {
    timeout = 0;
  }
  setTimeout(function(){
    alter_external_links(data_toggle_table+' tbody');
    shorten_displayed_content();
    pgs_tooltip();
  }, timeout);
}

function format_table_event(e) {
  format_table_content(750);
}


/*
 * Functions to display the trait category piechart and the different trait
 * categories and traits boxes.
 */

function reset_showhide_trait() {
  // Reset traits
  $('.trait_subcat_container').hide("slow");
  // Reset container min width (for horizontal scrolling)
  $('.trait_cat_container').css('min-width', '300px');
  // Reset button
  $('#reset_cat').hide("slow");
  // Reset search
  add_search_term('');
}

function fadeIn(elem) {
  elem.css('opacity', 0);
  elem.css('display', 'block');

  var op = 0.1;  // opacity step

  // Fade in the elem (fadeIn() is not included in the slim version of jQuery)
  var timer = setInterval(function () {
    if (op >= 1){
      clearInterval(timer);
    }
    elem.css('opacity', op);
    elem.css('filter', 'alpha(opacity=' + op * 100 + ")");
    op += op * 0.1;
  }, 15);
}

function showhide_trait(id, term) {
  var elem = $('#'+id);

  if (!elem.is(':visible')) {
    // Hide previously selected traits
    $('.trait_subcat_container').hide();

    // Display list of traits
    fadeIn(elem);

    // Add search term to filter the table
    add_search_term(term);

    // Change the min width to avoid having the lists under each other.
    // Trigger an horinzontal scroll
    $('.trait_cat_container').css('min-width', '800px');

    // Reset button
    $('#reset_cat').show("slow");
  }

  $('a.trait_item').mouseover(function() {
    trait_link = $(this).find('.trait_link');
    if (trait_link.length == 0) {
      $(this).append('<i class="trait_link fa fa-link"></i>');
    }
    else {
      trait_link.show();
    }
  });
  $('a.trait_item').mouseout(function() {
    $(this).find('.trait_link').hide();
  });
}


function add_search_term(term) {

  var elems = $('.search-input');
  if (elems.length > 0) {
    elem = elems[0];
    elem.focus({preventScroll: true});
    elem.value = term;
    elem.blur();

    setTimeout(function(){
      $('table.table[data-toggle="table"] tbody a[href^="http"]').attr('target','_blank');
      $('table.table[data-toggle="table"] tbody a[href^="http"]').not('[class*="pgs_no_icon_link"]').addClass("external-link");
    }, 500);
  }
}


// Buttons in the Search page results
$('.search_facet').click(function(){
  if ($(this).find('i.fa-circle-o')) {
    id = $(this).attr('id');
    type = id.replace('_facet', '');
    if (type == 'all') {
      $('.pgs_result').show();
    }
    else {
      entry_class = type+'_entry';
      $('.'+entry_class).show();
      $('.pgs_result').not('.'+entry_class).hide();
    }
    title = type.charAt(0).toUpperCase() + type.slice(1);

    $('.search_facet.selected').find('i').removeClass("fa-check-circle").addClass("fa-circle-o");
    $('.search_facet.selected').removeClass("selected");

    $(this).find('i').removeClass("fa-circle-o").addClass("fa-check-circle");
    $(this).addClass("selected");
  }
});


function display_category_list(data_json) {
  var trait_elem = document.getElementById("trait_cat");
  var subtrait_elem = document.getElementById("trait_subcat");

  item_height = 35;
  number_of_cat = Object.keys(data_json).length;

  cat_div_height = number_of_cat * item_height;
  cat_div_height += 'px';

  category_tooltip = 'data-toggle="tooltip" title=""';
  colour_to_replace = '##COLOUR##';
  colour_box = '<span class="trait_colour" style="background-color:'+colour_to_replace+'"></span>';
  count_to_replace = '##COUNT##';
  count_badge = '<span class="badge badge-pill badge-pgs float_right">'+count_to_replace+' <span>PGS</span></span>';
  category_arrow = '<i class="fa fa-arrow-circle-right"></i>';

  for (cat_index in data_json) {
    cat_index = parseInt(cat_index);

    var name     = data_json[cat_index].name;
    var cat_id   = data_json[cat_index].id+"_id";
    var div_id   = data_json[cat_index].id+"_list";
    var t_colour = data_json[cat_index].colour;
    var size_g   = data_json[cat_index].size_g;

    // Get an idea if the colour is quite light. If so, it will outline the arrow
    colour_light = t_colour.match(/^#(\w)\w(\w)\w(\w)/);
    count_nb_f = 0
    for (var i=1;i<4;i++) {
      if (colour_light[i] == 'F' || colour_light[i] == 'f') {
        count_nb_f++;
      }
    }

    var colour_span = colour_box.replace(colour_to_replace,t_colour);
    if (count_nb_f > 1) {
      colour_span = colour_span.replace('trait_colour','trait_colour trait_colour_border');
    }

    // Create category box
    var e = document.createElement('div');
    e.className = "trait_item";
    e.innerHTML = colour_span+'<span>'+name+'</span>'+count_badge.replace(count_to_replace,size_g);
    e.id = cat_id;
    e.setAttribute("data-toggle", "tooltip");
    e.setAttribute("data-placement", "left");
    e.setAttribute("data-delay", "800");
    e.setAttribute("title", "Click to display the list of traits related to '"+name+"'");
    e.setAttribute("onclick", "showhide_trait('"+div_id+"', '"+name+"')");
    trait_elem.appendChild(e);


    // Create sub-categories (traits) main container
    subcat_children = data_json[cat_index].children;
    var se = document.createElement('div');
    se.id = div_id;
    se.className = "trait_subcat_container clearfix";
    se.style.display = "none";

    // Arrow separator - vertical position
    var se_left = document.createElement('div');
    var class_name = (count_nb_f>1) ? 'trait_subcat_left trait_subcat_border' : 'trait_subcat_left';
    se_left.className = class_name;
    se_left.style.color = t_colour;
    se_left.innerHTML = category_arrow;
    var subcat_div_height_left = cat_index * item_height - 1;
    se_left.style.marginTop = subcat_div_height_left+"px";
    se.appendChild(se_left);

    // Sub-categories (traits) sub container - vertical position
    var se_right = document.createElement('div');
    se_right.className = "trait_subcat_right";

    var subcat_div_height_right = 0;
    var count = cat_index + (subcat_children.length/2);

    // One sub-category entry
    if (subcat_children.length == 1) {
      subcat_div_height_right = cat_index * item_height;
    }
    // Last entry
    else if (cat_index == number_of_cat-1) {
      cat_pos = cat_index * item_height;
      if (subcat_children.length < number_of_cat) {
        subcat_div_height_right = (number_of_cat - subcat_children.length)*item_height;
      }
    }
    // Other entries with more than 1 sub-category
    else if ((cat_index + (subcat_children.length/2)) < number_of_cat) {
      cat_pos = cat_index * item_height;
      subcat_div_height_right = cat_pos - ((subcat_children.length)*item_height)/2 + item_height/2;
    }
    // Other entries with more than 1 sub-category going over the end of the list
    else if ((cat_index + (subcat_children.length/2)) >= number_of_cat && subcat_children.length <= number_of_cat) {
      cat_pos = cat_index * item_height;
      subcat_div_height_right = (number_of_cat - subcat_children.length)*item_height;
    }

    // Display scrollbar for categories with lots of traits
    if (subcat_children.length > number_of_cat) {
      se_right.style.maxHeight = cat_div_height;
      se_right.classList.add("v-scroll");
    }

    se_right.style.marginTop = subcat_div_height_right+"px";

    // Create the sub-categories (traits) boxes
    for (subcat_index in subcat_children) {
      var sc_id   = subcat_children[subcat_index].id;
      var sc_name = subcat_children[subcat_index].name;
      var sc_size = subcat_children[subcat_index].size;
      var sc = document.createElement('a');
      sc.className = "trait_item";
      sc.innerHTML = colour_span+'<span>'+sc_name+'</span>'+count_badge.replace(count_to_replace,sc_size);
      sc.setAttribute("href", "/trait/"+sc_id);
      sc.setAttribute("data-toggle", "tooltip");
      sc.setAttribute("data-placement", "left");
      sc.setAttribute("data-delay", "800");
      sc.setAttribute("title", "Click to go to the detailed page of the '"+sc_name+"' trait");
      se_right.appendChild(sc);
    }
    se.appendChild(se_right);

    subtrait_elem.appendChild(se);
  }

  // Display list of trait categories
  fadeIn($("#trait_cat"));
}




//--------------------------------//
//  D3 chart classes & functions  //
//--------------------------------//

// Build and draw the Trait category piechart
class PGSPieChart {

  constructor(svg_id,data,width,height,margin) {
    this.svg_id = '#'+svg_id;
    this.data = data;

    this.width = width;
    this.height = height;
    this.margin = margin;

    this.set_radius();
    this.arc_val = 0.55;
    this.arcOver_min_val = 0.51;
    this.arcOver_max_val = 1.03;
    this.arc = this.get_d3_arc(this.arc_val);
    this.arcOver = this.get_d3_arc(this.arcOver_min_val, this.arcOver_max_val);

    this.use_external_interaction = 1;
    this.transition_time = 1500;
  }

  set_radius() {
    this.radius = Math.min(this.width, this.height - this.margin) / 2;
  }

  // Return a D3 arc object
  get_d3_arc(inner_coef, outer_coef) {
    if (!outer_coef) {
      outer_coef = 1;
    }
    return d3.arc().innerRadius(this.radius * inner_coef).outerRadius(this.radius * outer_coef);
  }

  set_piechart() {
    this.pie = d3.pie()
      .padAngle(0.01)
      .sort(null) // Do not sort group by size
      .value(d => d.size_g);
  }

  set_colours() {
    this.colours = d3.scaleOrdinal()
      .domain(this.data.map(d => d.name))
      .range(this.data.map(d => d.colour));
  }

  set_svg() {
    this.svg = d3.select(this.svg_id)
      .attr("width", this.width)
      .attr("height", this.height);
  }

  set_g() {
    this.g = this.svg.append("g")
      .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");
  }

  set_arcs_path(arcs) {
    var obj = this;
    obj.arcs_path = obj.g.selectAll("path")
      .data(arcs)
      .join("path")
        .attr("fill", d => obj.colours(d.data.name))
        .attr("d", obj.arc)
        .attr("cursor", "pointer")
        .attr("data-label", d => d.data.name)
        .attr("data-id", d => d.data.id)
        // Tooltip
        .each(function(d,i){
          var title = '<b>'+d.data.name +"</b>: "+d.data.size_g+" PGS";
          obj.add_tooltip($(this), title);
        })
        .on("click", function(d,i){
          var label = $(this).attr('data-label');
          var id = $(this).attr('data-id');
          showhide_trait(id+"_list", label);
        });
  }

  draw_piechart() {
    var obj = this;

    obj.set_svg();
    obj.set_g();

    obj.set_piechart();
    var arcs = obj.pie(obj.data);
    obj.set_colours();
    obj.set_arcs_path(arcs);

    if (obj.arcOver) {
      obj.pie_chart_hover();
    }
    obj.pie_chart_transition();
  }

  // Add a Bootstrap tooltip to the D3 chart
  add_tooltip(elem, title) {
    elem.tooltip({
      'title': title,
      'placement': 'right',
      'html': true
    });
  }

  // Add interaction when move the mouse on and out of a slice/arc
  pie_chart_hover() {
    var obj = this;
    this.arcs_path.on("mouseover", function(d) {
      var current_color = d3.select(this).style("fill");
      d3.select(this)
        .attr("d", obj.arcOver)
        .attr("fill", d3.hsl(current_color).darker(0.5));
        if (obj.use_external_interaction) {
          var id = $(this).attr('data-id');
          $('#'+id+"_id").addClass('trait_item_selected');
          $('#'+id+"_id").removeClass('trait_item');
        }
    })
    .on("mouseout", function(d) {
      var current_color = d3.select(this).style("fill");
      d3.select(this)
        .attr("d", obj.arc)
        .attr("fill", d3.hsl(current_color).brighter(0.5));
        if (obj.use_external_interaction) {
          var id = $(this).attr('data-id');
          $('#'+id+"_id").addClass('trait_item');
          $('#'+id+"_id").removeClass('trait_item_selected');
        }
    });
  }

  // Trait category list hover
  trait_item_hover(trait_item, type) {
    var obj = this;
    var id = $(trait_item).attr('id');
    var id_path = id.replace("_id", "");
    var current_color = d3.select("path[data-id='"+id_path+"']").style("fill");

    if (type == 'in') {
      d3.select("path[data-id='"+id_path+"']")
        .attr("d", obj.arcOver)
        .attr("fill", d3.hsl(current_color).darker(0.5));
    }
    else {
      d3.select("path[data-id='"+id_path+"']")
        .attr("d", obj.arc)
        .attr("fill", d3.hsl(current_color).brighter(0.5));
    }
  }

  // Adds a transition for the donut chart
  pie_chart_transition(trans_duration) {
    var obj = this;
    var angleInterpolation = d3.interpolate(obj.pie.startAngle()(), obj.pie.endAngle()());

    obj.arcs_path.transition()
      .duration(obj.transition_time)
      .attrTween('d', d => {
        var originalEnd = d.endAngle;
        return t => {
          var currentAngle = angleInterpolation(t);
          if (currentAngle < d.startAngle) {
            return '';
          }
          d.endAngle = Math.min(currentAngle, originalEnd);
          return obj.arc(d);
        };
      });
  }
}


// Build and draw sample distribution piecharts
class PGSPieChartSmall extends PGSPieChart {

  constructor(svg_id,data,width,height,margin,type) {
    super(svg_id,data,width,height,margin);
    this.type = type;

    this.set_radius();
    this.arc_val = 0.58;
    this.arcOver_min_val = 0.56;
    this.arcOver_max_val = 1.02;
    this.arc = this.get_d3_arc(this.arc_val);
    this.arcOver = this.get_d3_arc(this.arcOver_min_val, this.arcOver_max_val);

    this.use_external_interaction = 0;
    this.transition_time = 1000;
  }

  set_piechart() {
    this.pie = d3.pie()
      .padAngle(0.025)
      .sort(null) // Do not sort group by size
      .value(d => d.value);
  }

  set_colours() {
    this.colours_list = (this.type == 'sample') ? ["#3e95cd", "#8e5ea2"] : ["#F18F2B", "#4F78A7"];
    this.colours = d3.scaleOrdinal()
      .domain(this.data.map(d => d.name))
      .range(this.colours_list);
  }

  set_g() {
    this.g = this.svg.append("g")
      .attr("transform", "translate(" + this.width / 2 + "," + ((this.height - (this.margin - 20)) / 2) + ")");
  }

  set_arcs_path(arcs) {
    var obj = this;
    obj.arcs_path = obj.g.selectAll("path")
      .data(arcs)
      .join("path")
        .attr("fill", d => obj.colours(d.data.name))
        .attr("d", obj.arc)
        .each(function(d,i){
          var title = '<b>'+d.data.name +"</b>: "+d.data.value;
          obj.add_tooltip($(this), title);
        });
  }

  draw_legend() {
    var obj = this;

    // Legend
    var rect_width = 20;
    var rect_height = 14;

    // Reverse orders to match the piechart display
    var data_legend = obj.data;
    data_legend.reverse();

    var pc_colours_legend = obj.colours_list;
    pc_colours_legend.reverse();

    var legend_colours = d3.scaleOrdinal()
      .domain(data_legend.map(d => d.name))
      .range(pc_colours_legend)

    var nodeWidth = (d) => d.getBBox().width;

    // Create D3 legend
    const legend = obj.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(0,0)');

    const lg = legend.selectAll('g')
      .data(data_legend)
      .enter()
      .append('g')
        .attr('transform', (d,i) => `translate(${i * 100},${obj.height/2 + 15})`);

    lg.append('rect')
      .style('fill', d => legend_colours(d.value))
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', rect_width)
      .attr('height', rect_height);

    lg.append('text')
      .style('font-size', rect_height - 2)
      .style('fill', '#555')
      .attr('x', rect_width + 5)
      .attr('y', rect_height - 3)
      .text(d => d.name);

    var offset = 0;
    lg.attr('transform', function(d, i) {
      var x = offset;
      offset += nodeWidth(this) + 10;
      return `translate(${x},${obj.height - obj.margin/2 - 4})`;
    });

    legend.attr('transform', function() {
      return `translate(${(obj.width - nodeWidth(this)) / 2},${0})`
    });
  }
}



class PGSPieChartTiny extends PGSPieChart {

  constructor(svg_id,data,width,height,margin) {
    super(svg_id,data,width,height,margin);

    this.set_radius();
    this.arc_val = 0.55;
    // this.arcOver_min_val = 0.52;
    // this.arcOver_max_val = 1.02;
    this.arc = this.get_d3_arc(this.arc_val);
    // this.arcOver = this.get_d3_arc(this.arcOver_min_val, this.arcOver_max_val);
    this.arcOver = undefined;

    this.use_external_interaction = 0;
    this.transition_time = 0;
  }

  set_piechart() {
    this.pie = d3.pie()
      .padAngle(0.025)
      .sort(null) // Do not sort group by size
      .value(d => d[1]);
  }

  set_colours() {
    this.colours = d3.scaleOrdinal()
      .domain(this.data.map(d => d[0]))
      .range(this.data.map(d => anc_colours[d[0]]));
  }

  set_arcs_path(arcs) {
    var obj = this;
    obj.arcs_path = obj.g.selectAll("path")
      .data(arcs)
      .join("path")
        .attr("fill", d => obj.colours(d.data[0]))
        .attr("d", obj.arc);
        // .each(function(d,i){
        //   var title = '<b>'+d.data[0] +"</b>: "+d.data[1];
        //   obj.add_tooltip($(this), title);
        // });
  }

  add_text(label) {
    var obj = this;
    this.g.append("text")
      .attr("dy", ".35em")
      .attr("class","pie_text")
      .text(label);
  }
}
