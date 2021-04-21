require(["esri/Map", 
"esri/views/MapView", 
"esri/layers/FeatureLayer", 
"esri/widgets/Legend", 
"esri/widgets/ScaleBar", 
"esri/renderers/ClassBreaksRenderer"],

function(
  Map,
  MapView,
  FeatureLayer,
  Legend,
  ScaleBar,
  ClassBreaksRenderer
) {

/*****************************************************************
* Define symbols for each class break.
*****************************************************************/
  // This will take class breaks defined below and create individual symbols for them then put these classes into the renderer
 var createSym = function(clr) {
    return {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      color: clr,
      style: "solid",
      outline: {
        width: 0.2,
        color: [255, 255, 255, 0.5]
      }
    };
  }

  /*****************************************************************
   * Set each unique value(valueExpression) directly in the renderer's constructor. (arcade expression for Victory Margin)
   * The label property of each unique value will be used to indicate the field value and symbol in the legend.
   *****************************************************************/

  //Sets up a the renderer that will style our layer with classbreaks as an input
  var renderer = new ClassBreaksRenderer({
    valueExpression: "$feature.Percent_Dem_2020 - $feature.Percent_GOP_2020",
    legendOptions: {
      title: "Margin of Victory by % of Total Votes (Winner Vote % - Loser Vote %)"
    },
  //I don't think I need this bit anynmore, given that I'm defining the symbol above. 
    // defaultSymbol: {
    //   type: "simple-fill", // autocasts as new SimpleFillSymbol()
    //   color: "",
    //   style: "none",
    //   outline: {
    //     width: 0.5,
    //     color: [50, 50, 50, 0.6]
    //   }
    // },
    defaultLabel: "no data"
  });
  
  //Sets up a function that will take info defined in the function calls on init below and funnel it into the .addClassBreaksInfo method to create all the classes then...
  var addClass = function(min, max, clr, lbl, rnd) {
    rnd.addClassBreakInfo({
      minValue: min,
      maxValue: max,
    //...takes every class it creates and funnels it into the previously defined create symbol fuction
      symbol: createSym(clr),
      label: lbl
    });
  };
  
  addClass(-100, -40, "#d73027", "Margin > 40% for Trump", renderer);
  addClass(-40, -20, "#f46d43", "Margin 20-40% for Trump", renderer);
  addClass(-20, -10, "#fdae61", "Margin 10-20% for Trump", renderer);
  addClass(-10, 0, "#fee090", "Margin < 10% for Trump", renderer);  
  addClass(0, 10, "#e0f3f8", "Margin < 10% for Biden", renderer);    
  addClass(10, 20, "#abd9e9", "Margin 10-20% for Biden", renderer);  
  addClass(20, 40, "#74add1", "Margin 20-40% for Biden", renderer);
  addClass(40, 100, "#4575b4", "Margin > 40% for Biden", renderer);
  /*****************************************************************
   * Create Popup Template
   *****************************************************************/  
  const popupTemplate = {
    // autocasts as new PopupTemplate()
    title: "{Name} County",
    content: [
      {
        type: "fields",
        fieldInfos: [
          {
            fieldName: "Winner_2020",
            label: "2020 Presidential Election Winner",
            format: {
              places: 0,
              digitSeparator: true
            }
          },
          {
            fieldName: "Votes_Dem_2020",
            label: "Biden Votes",
            format: {
              places: 0,
              digitSeparator: true
            }
          },
          {
            fieldName: "Votes_GOP_2020",
            label: "Trump Votes",
            format: {
              places: 0,
              digitSeparator: true
            }
          }
        ]
      }
    ]
  };

  /*****************************************************************
   * Add Layer, map, and view
   *****************************************************************/ 
  const electionResultsLayer = new FeatureLayer({
    url:
      "https://services.arcgis.com/GL0fWlNkwysZaKeV/arcgis/rest/services/Minn_2012_2020_Electoral_Counties/FeatureServer/0",
    outFields: ["Name", "Winner_2020"], // used by queryFeatures
    title: "2020 US Presidential Election Results",
  //Turns off whole map by default
    definitionExpression: "ST=",
    renderer: renderer,
    popupTemplate: popupTemplate,
    opacity: 0.5
  });

  //not sure what this is doing...
  let graphics;

  const map = new Map({
    basemap: "hybrid",
    layers: [electionResultsLayer]
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-98.5726, 39.7890],
    zoom: 5
  });

  //Look for where to put the side panel
  const listNode = document.getElementById("list_counties");
  //populate side panel
 
  var populateSidebar = function() {
    electionResultsLayer.queryFeatures()
          .then(function(results) {
            graphics = results.features;

            const fragment = document.createDocumentFragment();

            graphics.forEach(function(result, index) {
              const attributes = result.attributes;
              const name = attributes.Name;

              // Create a list 
              const li = document.createElement("li");
              li.classList.add("panel-result");
              li.tabIndex = 0;
              li.setAttribute("data-result-id", index);
              li.textContent = name;

              fragment.appendChild(li);
            });
            // Empty the current list
            listNode.innerHTML = "";
            listNode.appendChild(fragment);
          })
          .catch(function(error) {
            console.error("query failed: ", error);
          });
      }
  /******************************************************************
   *
   * Add state search interface, Scale bar, and Legend
   *
   ******************************************************************/
   view.when(function() {
    view.ui.add("paneDiv", "top-left");
    document.getElementById("btnQuery").addEventListener("click", getState);
  });

  /******************************************************************
   *
   * Retrieve User input then get results
   *
   ******************************************************************/
  function getState() {
    var resultElem = document.getElementById('results');
    resultElem.innerHTML = '';
    var stateName = document.getElementById('stateName');
    var selectedState = stateName.value;
    electionResultsLayer.definitionExpression = "ST = '" + selectedState +"'";
    //populate sidebar with state county info
    populateSidebar();  
    electionResultsLayer.queryExtent().then(function(results){
      view.goTo(results.extent);
    });

    electionResultsLayer.queryFeatureCount().then(function(count){
      resultElem.innerHTML = 'Found ' + count + ' county election results within your selected state.';
    })

  }
/******************************************************************
 *
 * Listen to click events on side bar
 *
 ******************************************************************/
  // listen to click event on the county list
  listNode.addEventListener("click", onListClickHandler);

  function onListClickHandler(event) {
    const target = event.target;
    const resultId = target.getAttribute("data-result-id");

    // get the graphic corresponding to the clicked zip code
    const result = resultId && graphics && graphics[parseInt(resultId, 10)];

    if (result) {
      // open the popup at the centroid of zip code polygon
      // and set the popup's features which will populate popup content and title.

      view.goTo(result.geometry.extent.expand(2)).then(function() {
        view.popup.open({
          features: [result],
          location: result.geometry.centroid
        });
      })
      .catch(function(error){
        if (error.name != "AbortError"){
          console.error(error);
        }
      });
    }
  }
  /******************************************************************
   *
   * Add  Scale bar and Legend, remove zoom
   *
   ******************************************************************/
  const legend = new Legend({
    view: view,
  });

  const sBar = new ScaleBar({
    view: view,
    style: "ruler",
    unit: "non-metric"
  });

  view.ui.add(legend, "bottom-left");
  view.ui.add(sBar, "bottom-left");
  view.ui.remove("zoom");

});






