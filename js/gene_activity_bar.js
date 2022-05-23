/**
 * @summary Creates interactive activity bar plots for ModulomeVis
 * @author Kevin Rychel & Katherine Decker
 * requires Papa parse, Highstock, highcharts exporting module
 */

 // data download helper function
 function data_download(csv_data, file_name) {
    const a = document.createElement("a");
    a.style.display = "none";
    document.body.appendChild(a);

    // Set the HREF to a Blob representation of the data to be downloaded
    a.href = window.URL.createObjectURL(
        new Blob([csv_data], {type: 'text/plain'})
    );

    // Use download attribute to set set desired file name
    a.setAttribute("download", file_name);

    // Trigger the download by simulating click
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
 }

 // finds an element in a list
 function get_index(meta_head, elt_name) {
    var is_thing = (elt) => elt==elt_name;
    return meta_head.findIndex(is_thing);
 }

 // picks columns of interest based on what is in the metadata header
 function pick_cols_of_interest(meta_head) {
    cols_of_interest = []

    // bacillus
    var phase_idx = get_index(meta_head, 'phase')
    if (phase_idx != -1) {
        var media_idx = get_index(meta_head, 'media');
        var supplement_idx = get_index(meta_head, 'supplement');
        var time_idx = get_index(meta_head, 'time_min');

        return [media_idx, supplement_idx, phase_idx, time_idx]
    }

    // ecoli
    var media_idx = get_index(meta_head, 'Base Media');
    if (media_idx != -1) {
        var carbon_idx = get_index(meta_head, 'Carbon Source (g/L)');
        var supp_idx = get_index(meta_head, 'Supplement');
        var strain_idx = get_index(meta_head, 'Strain Description');

        return [strain_idx, media_idx, carbon_idx, supp_idx];
    }

    // staph
    var strain2 = get_index(meta_head, 'strain');
    if (strain2 != -1) {
        var time = get_index(meta_head, 'sample-time');
        var media2 = get_index(meta_head, 'base-media');
        var conditions = get_index(meta_head, 'conditions');

        return [strain2, media2, conditions, time];
    }

    return cols_of_interest
 }

 // BEGIN ERIN ADDITION
 var erins_color_dict = {
    '5G__uMax':'#d9d9d9', //gray
    '5G__NoCu':'#bdd7e7', //blues
    '5G__lowCu':'#6baed6', //blues
    '5G__medCu':'#3182bd', //blues
    '5G__highCu':'#08519c', //blues
    '5G__lowCH4':'#b3de69', //green
    '5G__WithLanthanum':'#e6550d', //orange
    '5G__NoLanthanum':'#fdbe85', //orange
    '5G__MeOH':'#fb8072', //red
    '5G__highO2_slow_growth':'#6a3d9a',
    '5G__NO3_lowO2_slow_growth':'#bc80bd', //purple
    '5G__lowO2_fast_growth':'#fccde5', //pink
    '5G__LanzaTech':'#33a02c', //green
    '5G__aa3_KO':'#e6f598', //light green
    '5G__crotonic_acid':'#fee08b', //yellow
}
// END ERIN ADDITION

 // Write Highcharts plot to container
 function generateGeneActivityBar(metaCSV, dataCSV, container) {
    // get the data
    var metadata = Papa.parse(metaCSV, {dynamicTyping: true}).data;
    var data = Papa.parse(dataCSV, {dynamicTyping: true}).data;

    // parse the metadata header to find the important columns
    var sample_idx = get_index(metadata[0], 'sample');
    var og_sample_idx = get_index(metadata[0], 'sample_og_name');
    if (sample_idx == -1) {
        sample_idx = 0
    }
    var project_idx = get_index(metadata[0], 'project');
    var link_idx = get_index(metadata[0], 'DOI');

    // cols of interest: tooltip will show these metadata
    // These will be updated by a button in the future
    var cols_of_interest = pick_cols_of_interest(metadata[0]);

    // zoom thresh: number of columns at which less data is displayed
    var zoom_thresh = 40

    // rearrange data for highcharts
    var bar_heights = [];
    var cond_names = [];
    var vert_lines = []; var curr_proj = null;
    var plot_bands = [];
    var point_locs = [];
    var bar_colors = []; // Erin addition
    var point_order = []; // Erin addition

    // START ERIN TINKER
    const priority = {
         "5G__uMax": 1,
         "5G__MeOH": 2,
         "5G__NoCu": 3,
         "5G__lowCu": 4,
         "5G__medCu": 5,
         "5G__highCu": 6,
         "5G__lowCH4": 7,
         "5G__WithLanthanum": 8,
         "5G__NoLanthanum": 9,
         "5G__highO2_slow_growth": 10,
         "5G__NO3_lowO2_slow_growth": 11,
         "5G__lowO2_fast_growth": 12,
      };

    data = data.sort((a,b) => priority[a[1]] - priority[b[1]]);

    // // keep track of sample order so I can sort metadata labels correctly??
    var last_j = 0;
    for (i = 1; i < data.length-1; i++) {
        for (j = 0; j < data[i][4]; j++) {        
            // skip first 5 columns, then proceed by 2's?
            //point_order[data[i][6 + 2*j - 1]]=j+last_j;
            point_order.push([data[i][6 + 2*j - 1],j+last_j]);
            //console.log(i, j, last_j, j+last_j);
        }
        last_j = j+last_j; // accumlation counter

    }
    // console.log("point order");
    // console.log(point_order);
    // console.log("UNSORTED??");
    // console.log(metadata);
    var sorted_meta = []
    sorted_meta.push(metadata[0]); // add header row
    for (i = 0; i < point_order.length; i++) {
        // +1 at the end to skip metadata header row
        sorted_meta.push(metadata[point_order[i][0]+1]);
    }
    //metadata = metadata.sort((a,b) => point_order[a.index] - point_order[b.index]);
    // console.log("SORTED??");
    // console.log(sorted_meta);

    // reset metadata var
    metadata = sorted_meta;

    // END ERIN TINKER

    for (i = 1; i < data.length-1; i++) {

        // add in the basics
        //cond_names.push(data[i][1]);
        cond_names.push(data[i][1].slice(4));
        bar_heights.push(data[i][2]);
        bar_colors.push(erins_color_dict[data[i][1]]) // Erin Addition

        // look at projects to determine vertical lines & plot bands
        var meta_idx = data[i][5] + 1;
        var project = metadata[meta_idx][project_idx];

        if (project != curr_proj) {

            // first project
            if (curr_proj == null) {
                //plot_bands.push({label:{text:project, verticalAlign: 'bottom', y: 5, x:5, rotation: 300, textAlign: 'right', style:{color: 'gray'}}, from:-0.5, color:'white'})
                plot_bands.push({label:{verticalAlign: 'bottom', y: 5, x:5, rotation: 300, textAlign: 'right', style:{color: 'gray'}}, from:-0.5, color:'white'})
            } else { //all other projects
                vert_lines.push({value: i-1.5, width: 1, zIndex: 5, color: 'gray'});
                plot_bands[plot_bands.length-1]['to'] = i-0.5;
                plot_bands.push({label:{text:project, verticalAlign: 'bottom', y: 5, x:5, rotation: 300, textAlign: 'right', style:{color: 'gray'}}, from:i-0.5, color:'white'});
            }
            curr_proj = project;
        }

        // add point locations for individual samples
        for (j = 0; j < data[i][4]; j++) {
            point_locs.push([i-1, data[i][6 + 2*j]]);
        }
    }
    plot_bands[plot_bands.length-1]['to'] = data.length-1.5;

    // set up plot
    var chartOptions = {
        colors:bar_colors, // Erin addition
        chart: {
            //spacingBottom: 50,
            spacingBottom: -50,
            zoomType: 'x',
            events: {
                load: function() {
                    $('.highcharts-scrollbar').hide()
                }
            },
            resetZoomButton: {
                position: {
                    verticalAlign: 'bottom'
                }
            }
        },
        title: {
            text: ''
        },
        xAxis: {
            categories: cond_names,
            crosshair: true,
            plotLines: vert_lines,
            plotBands: plot_bands,
            labels: {
                //enabled: false
                enabled: true
            },
            scrollbar: {
                enabled: true,
                margin: 50,
                showFull: false
            },
            events: {
                // resize events
                afterSetExtremes: function(e) {
                    if (e.trigger == "zoom") {
                        // toggle project/condition labels
                        if (e.max - e.min < zoom_thresh) {
                            chart.update({
                                chart: {
                                    spacingBottom: 15
                                },
                                xAxis: {
                                    labels: {enabled: true},
                                    plotBands: [],
                                    scrollbar: {margin: 10}
                                }
                            });
                        } else {
                            chart.update({
                                chart: {
                                    spacingBottom: 50
                                },
                                xAxis: {
                                    labels: {enabled: false},
                                    plotBands: plot_bands,
                                    scrollbar: {margin: 50}
                                }
                            });
                        }
                    }
                }
            }
        },
        yAxis: {
            title:{
                text: 'Log TPM Gene Expression',
            },
            crosshair: true,
            startOnTick: false,
            endOnTick: false
        },
        plotOptions: {
            column: {
                pointPadding: 0,
                borderWidth: 1,
                groupPadding: 0,
                shadow: false,
            }
        },
        series: [{
                name: 'X_avg',
                type: 'column',
                data: bar_heights,
                color: '#2085e3',
                colorByPoint: true,
                events: {
                    click: function(e) {
                        // do nothing if the metadata doesn't contain links
                        if (link_idx == -1) {
                            return
                        }

                        // go to the DOI of this sample on click
                        // find DOI
                        var index = e.point.index + 1;
                        var meta_index = data[index][5] + 1;
                        var link = metadata[meta_index][link_idx];

                        // check if it exists
                        if (link != null) {
                            //sometimes the link is the last word
                            var link_str = link.split(" ");
                            link = link_str[link_str.length -1]

                            if (link[0] == 'h') {
                                window.open(link);
                            } else {
                                window.open('http://' + link);
                            }
                        }
                    }
                }
            }, {
                name: 'X',
                type: 'scatter',
                data: point_locs,
                color: 'black',
                jitter: {
                    x: 0.25,
                    y: 0
                },
                marker: {
                    radius: 3
                },
                stickyTracking: false,
            }],
        tooltip: {
            formatter: function() {

                var tooltip = "";
                // bars
                if (this.series.name == 'X_avg') {
                    var index = this.point.x + 1;
                    var meta_index = data[index][5] + 1;
                    // header: condition name (n)
                    tooltip += '<span style="font-size: 10px">' + data[index][1] + ' (' + data[index][4] + ')</span><br>';

                    // activity
                    tooltip += 'X: '+ this.point.y.toFixed(2);
                    if (data[index][4] > 1) {
                        tooltip +=  ' ± ' + data[index][3].toFixed(2);
                    }
                }
                else {
                    index = this.point.x + 1;
                    meta_index = this.point.index + 1;

                    // header: sample name
                    tooltip += '<span style="font-size: 10px">' + metadata[meta_index][sample_idx] + '</span><br>';
                    // ERIN adjustment to give fermentor run name
                    tooltip += '<span style="font-size: 10px">' + metadata[meta_index][og_sample_idx] + '</span><br>';
                    
                    // activity
                    tooltip += 'X: '+ this.point.y.toFixed(2);
                }

                // metadata
                for (col in cols_of_interest) {
                    meta_val = metadata[meta_index][cols_of_interest[col]]
                    if (meta_val != null) {
                        tooltip += '<br>'
                        tooltip += metadata[0][cols_of_interest[col]] + ': ';
                        tooltip += meta_val;
                    }
                }

                return tooltip;
            },
            shared: false
        },
        exporting: {
            menuItemDefinitions: {
                downloadMeta: {
                    onclick: function() {
                        data_download(metaCSV, 'metadata.csv');
                    },
                    text: 'Download metadata'
                },
                downloadData: {
                    onclick: function() {
                        data_download(dataCSV, 'activity_data.csv');
                    },
                    text: 'Download activity data'
                }
            },
            buttons: {
                contextButton: {
                    menuItems: ['viewFullscreen', 'downloadPNG', 'downloadPDF', 'downloadData', 'downloadMeta']
                }
            }
        },
        legend: {
            enabled: false
        },
        credits: {
            enabled: false
        }
    };

    // make the chart
    var chart = Highcharts.chart(container, chartOptions);
 };