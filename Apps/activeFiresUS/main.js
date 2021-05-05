require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/widgets/Legend",
    "esri/widgets/Expand",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Locate",
    "esri/widgets/ScaleBar"], 

function(
    Map,
    MapView,
    FeatureLayer,
    Legend,
    Expand,
    BasemapGallery,
    Locate,
    ScaleBar
) {

    //const referenceScale = 9244650*2;
   /*****************************************************************
     * Create picture symbol and add sizing based on acres
    *****************************************************************/ 
    const renderer = {
    type: "simple",
    symbol: {
    type: "picture-marker",
    url: "https://img.icons8.com/color/48/000000/fire-element--v2.png",
    height: "32px",
    width: "32px"
    },

      visualVariables: [
        {
          type: "size",
          field: "DailyAcres",
          minDataValue: .1,
          //Might need to adjust this number to reflect larger fires.
          maxDataValue: 10000,
          minSize: 25,
          maxSize: 55
        }
      ]

    };
    
   /*****************************************************************
     * Create Popup Template
    *****************************************************************/  
    const popupTemplate = {
      // autocasts as new PopupTemplate()
      title: "{IncidentName} Wildfire Incident - {POOCounty} County, {POOState}",
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "DailyAcres",
              label: "Current Acres Burned",
              format: {
                places: 1,
                digitSeparator: true
              }
            },
            {
              fieldName: "PercentContained",
              label: "Percent Contained %",
              format: {
                places: 0,
                digitSeparator: true
              }
            },
            {
              fieldName: "FireCause",
              label: "Fire Cause",
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
     * Link to Layer
    *****************************************************************/  
    const layer = new FeatureLayer({
    url:
    "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/USA_Wildfires_v1/FeatureServer/0",
        title: "Current USA Wildfire Incidents (Acres)",
        renderer: renderer,
        popupTemplate: popupTemplate,
        opacity: 0.8,
        definitionExpression: "IncidentTypeCategory = 'WF'"+"AND DailyAcres IS NOT NULL"
    });

    let graphics;
    /*****************************************************************
     * Create map and view
    *****************************************************************/  
    const map = new Map({
      basemap: "streets-night-vector",
      layers: [layer]
    });

    const view = new MapView({
      container: "viewDiv",
      map: map,
      //scale: referenceScale,
      center: [-98.5726, 39.7890],
      zoom: 4,
    });

    /******************************************************************
     * Side Bar Guts
     ******************************************************************/
    //Look for where to put the side panel
    const listNode = document.getElementById("list_counties");
    //populate side panel
    
    var populateSidebar = function() {
        layer.queryFeatures()
            .then(function(results) {
                graphics = results.features;

                const fragment = document.createDocumentFragment();

                graphics.forEach(function(result, index) {
                const attributes = result.attributes;
                const name = attributes.IncidentName;
                const acres = attributes.DailyAcres;


                // Create a list 
                const li = document.createElement("li");
                li.classList.add("panel-result");
                li.tabIndex = 0;
                li.setAttribute("data-result-id", index);
                li.textContent = name + " Fire - "+acres+ " Acres Burned" ;

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
     * Add state search interface
     ******************************************************************/
     view.when(function() {
        view.ui.add("paneDiv", "top-left");
        document.getElementById("btnQuery").addEventListener("click", getState);
        });
    /******************************************************************
     * Retrieve User input then get results
     ******************************************************************/
    function getState() {
        var resultElem = document.getElementById('results');
        resultElem.innerHTML = '';
        var stateName = document.getElementById('stateName');
        var selectedState = stateName.value;
        layer.definitionExpression = "POOState ='"+'US-' + selectedState +"'"+"AND IncidentTypeCategory = 'WF'"+"AND DailyAcres IS NOT NULL";
        console.log(layer.definitionExpression)
        //populate sidebar with state fire info
        populateSidebar();  
        layer.queryExtent().then(function(results){
        view.goTo(results.extent);
        });

        layer.queryFeatureCount().then(function(count){
        resultElem.innerHTML = 'There are ' + count + ' active wildfire incidents within your selected state.';
        })

    }
    /******************************************************************
     * Listen to click events on side bar
     ******************************************************************/
    // listen to click event on the fire list
    listNode.addEventListener("click", onListClickHandler);

    function onListClickHandler(event) {
        const target = event.target;
        const resultId = target.getAttribute("data-result-id");

        // get the graphic corresponding to the clicked fire
        const result = resultId && graphics && graphics[parseInt(resultId, 10)];

        if (result) {
        // open the popup
            view.popup.open({
                features: [result],
                location: result.geometry.centroid
            });
        //Couldn't get this zoom to feature to work :(
            // view.goTo(result.geometry.centroid.expand(2)).then(function() {
            //     view.popup.open({
            //     features: [result],
            //     location: result.geometry.centroid
            //     });
            // })
            // .catch(function(error){
            //     if (error.name != "AbortError"){
            //     console.error(error);
            //     }
            // });
        }
    }
    /*****************************************************************
     * Create Legend, scale bar, basemap gallery, and remove zoom button
    *****************************************************************/  
    const legend = new Legend({
      view: view,
      layerInfos: [
        {
          layer: layer,
          title: "Active US Wildfire Incidents (Acres Burned)",
        }
      ]
    });

    const basemapGallery = new BasemapGallery({
        view: view
    });

    const locateWidget = new Locate({
        view: view,
    });

    const expand1 = new Expand({
        view: view,
        content: legend,
        expandIconClass: "esri-icon-legend",
        group: "bottom-left",
        expandTooltip: "Legend"
    });

    const expand2 = new Expand({
        view: view,
        content: basemapGallery,
        expandIconClass: "esri-icon-basemap",
        group: "bottom-left",
        expandTooltip: "Basemap Gallery"
    });

    const sBar = new ScaleBar({
    view: view,
    style: "ruler",
    unit: "non-metric"
    });

    view.ui.add([expand1, expand2, locateWidget], "bottom-left")
    view.ui.add(sBar, "bottom-left");
    view.ui.remove("zoom");
});