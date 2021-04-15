require(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer", "esri/widgets/Legend", "esri/widgets/ScaleBar"], function(
  Map,
  MapView,
  FeatureLayer,
  Legend,
  ScaleBar,
) {

/*****************************************************************
* Define symbols for each class break.
*****************************************************************/

  // Republican Margin Symbols
   const rep10 = {
    type: "simple-fill", // autocasts as new SimpleFillSymbol()
    color: "#fee090",
    style: "solid",
    outline: {
      width: 0.2,
      color: [255, 255, 255, 0.5]
    }
  };

  const rep20 = {
    type: "simple-fill", // autocasts as new SimpleFillSymbol()
    color: "#fdae61",
    style: "solid",
    outline: {
      width: 0.2,
      color: [255, 255, 255, 0.5]
    }
  };

  const rep40 = {
    type: "simple-fill", // autocasts as new SimpleFillSymbol()
    color: "#f46d43",
    style: "solid",
    outline: {
      width: 0.2,
      color: [255, 255, 255, 0.5]
    }
  };

  const repMore40 = {
    type: "simple-fill", // autocasts as new SimpleFillSymbol()
    color: "#d73027",
    style: "solid",
    outline: {
      width: 0.2,
      color: [255, 255, 255, 0.5]
    }
  };

// Democratic Margin Symbols
  const dem10 = {
    type: "simple-fill", // autocasts as new SimpleFillSymbol()
    color: "#e0f3f8",
    style: "solid",
    outline: {
      width: 0.2,
      color: [255, 255, 255, 0.5]
    }
  };

  const dem20 = {
    type: "simple-fill", // autocasts as new SimpleFillSymbol()
    color: "#abd9e9",
    style: "solid",
    outline: {
      width: 0.2,
      color: [255, 255, 255, 0.5]
    }
  };

  const dem40 = {
    type: "simple-fill", // autocasts as new SimpleFillSymbol()
    color: "#74add1",
    style: "solid",
    outline: {
      width: 0.2,
      color: [255, 255, 255, 0.5]
    }
  };

  const demMore40 = {
    type: "simple-fill", // autocasts as new SimpleFillSymbol()
    color: "#4575b4",
    style: "solid",
    outline: {
      width: 0.2,
      color: [255, 255, 255, 0.5]
    }
  };

  /*****************************************************************
   * Set each unique value directly in the renderer's constructor. (arcade expression for Victory Margin)
   * The label property of each unique value will be used to indicate
   * the field value and symbol in the legend.
   *****************************************************************/

  const renderer = {
    type: "class-breaks", // autocasts as new ClassBreaksRenderer()
    valueExpression: "$feature.Percent_Dem_2020 - $feature.Percent_GOP_2020",
    legendOptions: {
      title: "Margin of Victory by % of Total Votes (Winner Vote % - Loser Vote %)"
    },
    defaultSymbol: {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      color: "",
      style: "none",
      outline: {
        width: 0.5,
        color: [50, 50, 50, 0.6]
      }
    },
    defaultLabel: "no data",
    classBreakInfos: [
      {
        minValue: -100,
        maxValue: -40,
        symbol: repMore40,
        label: "Margin > 40% for Trump"
      },
      {
        minValue: -40,
        maxValue: -20,
        symbol: rep40,
        label: "Margin 20-40% for Trump"
      },
      {
        minValue: -20,
        maxValue: -10,
        symbol: rep20,
        label: "Margin 10-20% for Trump"
      },
      {
        minValue: -10,
        maxValue: 0,
        symbol: rep10,
        label: "Margin < 10% for Trump"
      },
      {
        minValue: 0,
        maxValue: 10,
        symbol: dem10,
        label: "Margin < 10% for Biden"
      },
      {
        minValue: 10,
        maxValue: 20,
        symbol: dem20,
        label: "Margin 10-20% for Biden"
      },
      {
        minValue: 20,
        maxValue: 40,
        symbol: dem40,
        label: "Margin 20-40% for Biden"
      },
      {
        minValue: 40,
        maxValue: 100,
        symbol: demMore40,
        label: "Margin > 40% for Biden"
      }
    ]
  };
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
  view.whenLayerView(electionResultsLayer).then(function(layerView) {
    layerView.watch("updating", function(value) {
      if (!value) {
        // wait for the layer view to finish updating

        // query all the features available for drawing.
        layerView
          .queryFeatures({
            geometry: view.extent,
            returnGeometry: true,
            orderByFields: ["Name"]
          })
          .then(function(results) {
            graphics = results.features;

            const fragment = document.createDocumentFragment();

            graphics.forEach(function(result, index) {
              const attributes = result.attributes;
              const name = attributes.Name;

              // Create a list zip codes in NY
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
    });
  });
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







