/**
 * @summary Creates interactive gene tables for ModulomeVis
 * @author Kevin Rychel
 * requires Papa parse, tabulator
 */

//helper for querystring params
function qs(key) {
    key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
    var match = location.search.match(new RegExp("[?&]" + key + "=([^&]+)(&|$)"));
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}

// Write table to container 
function generateGeneTable(csvContent, container, organism, dataset = "modulome") {
    // get the data
    var data = Papa.parse(csvContent, {dynamicTyping: true}).data;

    //console.log(data);

    // for tabulator, convert rows into objects
    var tabledata = []
    for (i = 1; i < data.length - 1; i++) { //rows, excluding header
        var obj = {id: i};
        for (j = 0; j < data[0].length - 1; j++) { //cols, excluding link
            obj[data[0][j]] = data[i][j];
        }
        tabledata.push(obj)
    }

    // make a header menu object for the columns
    var headerMenu = [
        {
            label: "<i class='fas fa-arrow-right'></i> Move Column to End",
            action: function (e, column) {
                column.move("end");
            }
        }, {
            label: "<i class='fas fa-trash'></i> Hide Column",
            action: function (e, column) {
                column.hide();
            }
        }
    ]

    if (organism == "m_buryatense" && (dataset == "k_means" || dataset == "birch")){
         // columns object: basic info
    var columns = [
        {
            title: "Locus Tag", 
            field: "locus_tag", 
            headerContextMenu: headerMenu
        },
        {
            title: "Gene", 
            field: "gene",
            //formatter: "money", formatterParams: {precision: 4},
            headerContextMenu: headerMenu
        },
        {
            title: "Gene Product", 
            field: "product", 
            headerContextMenu: headerMenu
        },
        {
            title: "Start Coordinate", 
            field: "start_coord", 
            headerContextMenu: headerMenu
        },
        {
            title: "End Coordinate", 
            field: "end_coord", 
            headerContextMenu: headerMenu
        },
        {
            title: "Length", 
            field: "length", 
            headerContextMenu: headerMenu
        },
        {
            title: "Known Grouping", // ask about true terminology for this
            field: "group", 
            headerContextMenu: headerMenu
        }
    ]
    }

    else {

        // columns object: basic info
    var columns = [
        {title: "", field: "locus", width: 50},
        {
            title: "M<sub>i</sub>", field: "gene_weight",
            formatter: "money", formatterParams: {precision: 4},
            headerContextMenu: headerMenu
        },
        {title: "Name", field: "gene_name", headerContextMenu: headerMenu}
    ]

    // add organism-specific columns
    var tf_column_start = 7
    if (organism == 's_acidocaldarius') {
        columns.push({
            title: "Old Locus Tag", field: "old_locus_tag",
            headerContextMenu: headerMenu
        })
        tf_column_start = 8
    }

    // add TF columns
    for (j = tf_column_start; j < data[0].length - 1; j++) {
        columns.push({
            title: data[0][j], field: data[0][j],
            formatter: "tickCross", headerContextMenu: headerMenu
        });
    }
    // add additional columns
    columns = columns.concat([
        {
            title: "Product", field: "gene_product", formatter: "html",
            headerContextMenu: headerMenu
        },
        {title: "COG", field: "cog", headerContextMenu: headerMenu},
        {title: "Operon", field: "operon", headerContextMenu: headerMenu},
        //{title: "TF", field: "regulator", headerContextMenu: headerMenu},
        {title: "GO terms", field: "specific_gos_n",formatter:'textarea', headerContextMenu: headerMenu}, // Erin addition
        {field: "end", visible: false} // facilitates moving to end
    ]);
    }

    // generate the table
    var table = new Tabulator('#' + container, {

        maxHeight: "100%",
        data: tabledata,
        columns: columns,
        initialSort: [
            {column: "gene_weight", dir: "desc"}
        ],

        rowClick: function (e, row) { //link to the page in a database
            var link = 'gene.html?';
            link += 'organism=' + qs('organism') + '&';
            link += 'dataset=' + qs('dataset') + '&';
            link += 'gene_id=' + row.getData().locus_tag
            window.open(link);
        },
        tooltips: function (cell) {
            return "Click to view gene dashboard";
        }

    });
    table.redraw(true); // Erin addition: fixed the GO term row heights?? 
    
    // hide unwanted columns
    if (!data[0].includes("operon")) {
        table.hideColumn("operon");
    }
};