/**
 * @summary Creates interactive parallel coordinate plot
 * @author Vrishab Sathish Kumar
 * requires d3.js
 */

// Plot the differential gene expression across columns (growth conditions)
function generateParallelCoordsPlot(csvContent, container, organism, dataset, chart_type="highchart"){

    var data = Papa.parse(csvContent, {dynamicTyping: true}).data;

    var expression_only_data = []

    data.slice(1).forEach(loci_data => {
        expression_only_data.push(loci_data.slice(2, loci_data.length))
    });

    console.log(expression_only_data)
 

    console.log(data[1])
    

    var chart = Highcharts.chart('parallel_coords', {
        chart: {
            type: 'spline',
            parallelCoordinates: true,
            parallelAxes: {
                lineWidth: 2
            }
        },
        title: {
            text: 'Differential Expression Across Growth Conditions'
        },
        lang: {
            accessibility: {
                axis: {
                    yAxisDescriptionPlural: 'The chart has 7 Y axes across the chart displaying Training date, Miles for training run, Training time, Shoe brand, Running pace per mile, Short or long, and After 2004.'
                }
            }
        },
        plotOptions: {
            series: {
                accessibility: {
                    enabled: false
                },
                animation: false,
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: false
                        }
                    }
                },
                states: {
                    hover: {
                        halo: {
                            size: 0
                        }
                    }
                },
                events: {
                    mouseOver: function () {
                        this.group.toFront();
                    }
                }
            }
        },
        tooltip: {
            pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
                '{series.name}: <b>{point.formattedValue}</b><br/>'
        },
        xAxis: {
            categories: [
                "LanzaTech"
                ,"MeOH"
                ,"NO3_lowO2_slow_growth"
                ,"NoCu"
                ,"NoLanthanum"
                ,"WT_control"
                ,"WithLanthanum"
                ,"aa3_KO"
                ,"crotonic_acid"
                ,"highCu"
                ,"highO2_slow_growth"
                ,"lowCH4"
                ,"lowCu"
                ,"lowO2_fast_growth"
                ,"lowO2_low_iron_fast_growth"
                ,"lowO2_slow_growth"
                ,"medCu"
                ,"slow_growth"
                ,"uMax"
                ,"unknown"
            ],
            offset: 10
        },
        yAxis: {
            title: [
                "Log Ratio TPM (w/ Respect to uMax Growth Conditions)"  
            ]   
        },
        colors: ['rgba(11, 200, 200, 0.1)'],
        series: expression_only_data.map(function (set, i) {
            return {
                name: 'Log Ratio TPM (w/ Respect to uMax) ',
                data: set,
                shadow: true
            };
        })
    });

    return
}
