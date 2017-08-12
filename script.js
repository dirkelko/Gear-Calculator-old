// Constants
var nMaxChainringTeeth = 64;
var nMinChainringTeeth = 20;
var nSelectableChainrings = nMaxChainringTeeth - nMinChainringTeeth;
var nMaxNumberChainrings = 3;

var nMaxSprocketTeeth = 50;
var nMinSprocketTeeth = 9;
var nSelectableSprockets = nMaxSprocketTeeth - nMinSprocketTeeth;
var nMaxNumberSprockets = 12;

 //var gearSet = {};
 //var gearSet2 = {};

//var hubType = ["DERS"];
var hubType2;
var hubType;
var hubTypes = [];
    hubTypes.getById = function(id) {
            for ( var ih = 0; ih < this.length; ih++){
                if ( id === this[ih].id){
                    return this[ih];
                }
            }
        };

var tireType;
var tireTypes =[];
    tireTypes.getNameByCircumference = function(id) {
            for ( var it = 0; it < this.length; it++){
                if ( id === this[it].id){
                    return this[it].name;
                }
            }
            return id +"mm";
    };

// initial values
var circumference = "2240";
var circumference2 = "2240";
var cadence = 90;
var cadenced = 5;
var cross_min = 2.5;
var cross_max = 14;
var cross_s = 3;

//distance/mm between sprockets
var distSprockets = [5.5, 5.5, 5.5, 5.5, 5.3, 5.0, 5.0, 4.8, 4.34, 3.95, 3.9, 3.5];
var distChainrings = 5.0;

// object for storing display options:
var dsplOps = { siUnits:true, values:"teeth", maxChainAngle:2.6};

var canvas2;
var c2visible = false;
var c2active = false;

var GearSet = function( aCWs, aSPs, circumference, hubType){

	this.circumference = circumference;
	this.hubType = hubType;

	this.Chainrings = [];
	for (var ic = 0; ic < aCWs.length; ic++) {
		if (aCWs[ic] > 0){
			this.Chainrings.push(aCWs[ic]);
		}
	}
	this.Chainrings.sort(function(a,b){return a - b;});
	this.Cogs = [];
	for (ic = 0; ic < aSPs.length; ic++){
		if( aSPs[ic] > 0) {
			this.Cogs.push(aSPs[ic]);
		}
	}

	// get data from Hub gears if
	// hubData = "RLSH,2.1,42,16,0.279,0.316,0.360,0.409,0.464,0.528,0.600,0.682,0.774,0.881,1.000,1.135,1.292,1.467"
	this.HubGears = [];
	if (hubType.id !== "DERS"){
		// old: this.HubGears = hubData.slice(4, hubData.length);
		this.HubGears = hubType.ratios;
		this.isGearHub = true;
	} else {
		this.HubGears = [1.0];
		this.isGearHub = false;
	}
	this.GearType = hubType.id;
	this.Cogs.sort(function(a,b){return a - b;});
	//this.Ratios = new Array();
	this.ChainAngle = [];
	// calculate chain angle for each gear
	this.Ratios = new Array(this.Chainrings.length);
	this.ChainAngle = new Array(this.Chainrings.length);
	for ( ic = 0; ic < this.Chainrings.length; ic++ ){
		this.Ratios[ic] = new Array(this.Cogs.length);
		this.ChainAngle[ic] = new Array(this.Cogs.length);
		for (var jc = 0; jc < this.Cogs.length; jc++){
			this.Ratios[ic][jc] = this.Chainrings[ic] / this.Cogs[jc];
			var dist = Math.abs((ic - ( this.Chainrings.length - 1) / 2) * distChainrings - ((this.Cogs.length - 1) / 2 - jc ) * distSprockets[this.Cogs.length - 1] );
			this.ChainAngle[ic][jc] = ( Math.asin( dist / 430) / Math.PI * 180  );
		}
	}
	// calculate minimum Development and maximum Development for this gearSet (this.HubGears = [1.0] for derailleurs)
	this.minDev = this.Ratios[0][this.Cogs.length - 1] * this.circumference / 1000 * this.HubGears[0];
	this.maxDev = this.Ratios[this.Chainrings.length - 1][0] * this.circumference / 1000 * this.HubGears[this.HubGears.length - 1];

	return this;
};


function getURLParameter(name) {
    //first check if it is an old URL with "/#" instead of "/?"
    var search = (location.href.indexOf("#"))? "?"+location.href.substring(location.href.indexOf("#")+1, location.href.length ) : location.search ;
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

function createURL(gearSet, gearSet2, cadence, dsplOps){
    var url = location.origin + location.pathname + "?GR=" + gearSet.GearType + "&KB=" + gearSet.Chainrings +"&RZ=" + gearSet.Cogs + "&UF=" + gearSet.circumference
        + "&TF=" + cadence + "&SL=" + dsplOps.maxChainAngle + "&UN=" + ((dsplOps.siUnits)?"KMH":"MPH");
    if ( c2visible ) {
        url = url + "&GR2=" + gearSet2.GearType + "&KB2=" + gearSet2.Chainrings + "&RZ2=" + gearSet2.Cogs + "&UF2=" + gearSet2.circumference;
    }
    return url;
//  http://www.ritzelrechner.de/#KB=39,53&RZ=12,13,14,15,16,17,18,19,21,23&GR=DERS&KB2=39,53&RZ2=12,13,14,15,16,17,18,19,21,23&GT2=DERS&UF2=2099&TF=85&UF=2099&SL=2
}

function drawBothGraphics(canvas, canvas2, gearSet, gearSet2, cadence, dsplOps) {

	var minDev = Math.min(gearSet.minDev, gearSet2.minDev);
	var maxDev = Math.max(gearSet.maxDev, gearSet2.maxDev);

	drawGraphics(canvas, gearSet, minDev, maxDev, cadence, dsplOps);
	drawGraphics(canvas2, gearSet2, minDev, maxDev, cadence, dsplOps);
}

// update the graphics based on the current parameters
function updateGraphics(canvas, canvas2, gearSet, gearSet2){
	if (canvas.getContext){
		if(c2visible && canvas2.getContext){
			var minDev = Math.min(gearSet.minDev, gearSet2.minDev);
        	var maxDev = Math.max(gearSet.maxDev, gearSet2.maxDev);
        	drawGraphics(canvas, gearSet, minDev, maxDev, cadence, dsplOps);
        	drawGraphics(canvas2, gearSet2, minDev, maxDev, cadence, dsplOps);
		} else {
            drawGraphics(canvas, gearSet, gearSet.minDev, gearSet.maxDev, cadence, dsplOps);
		}
	}
}


// Document ready for initializing the screen and defining the event handlers using jQuery
$(document).ready( function() {

    var aChainrings = ["00", "22", "36"];
    var aSprockets = ["00","00","11", "12", "14", "16", "18", "21", "24", "28", "32", "36"];
    var aChainrings2 = ["00", "22", "36"];
    var aSprockets2 = ["00","00","11", "12", "14", "16", "18", "21", "24", "28", "32", "36"];
    var aCopyChainrings = ["00", "22", "36"];
    var aCopySprockets = ["00","00","11", "12", "14", "16", "18", "21", "24", "28", "32", "36"];
    var aCopyChainrings2 = ["00", "22", "36"];
    var aCopySprockets2 = ["00","00","11", "12", "14", "16", "18", "21", "24", "28", "32", "36"];

    var gearSet = {};
    var gearSet2 = {};

    // Localization of HTML elements and tooltips with l10n.js library and localization.js file
    document.getElementById("l_gearing").firstChild.nodeValue = "%gearing".toLocaleString();
    document.getElementById("l_chainrings").firstChild.nodeValue = "%chainrings".toLocaleString();
    document.getElementById("l_sprockets").firstChild.nodeValue = "%sprockets".toLocaleString();
    document.getElementById("l_wheel_size").firstChild.nodeValue = "%wheel_size".toLocaleString();
    document.getElementById("l_display").firstChild.nodeValue = "%display".toLocaleString();
    document.getElementById("l_cadence").firstChild.nodeValue = "%cadence".toLocaleString();
    document.getElementById("l_chain_angle").firstChild.nodeValue = "%chain_angle".toLocaleString();
    document.getElementById("l_units").firstChild.nodeValue = "%units".toLocaleString();
    document.getElementById("buttonCompare").firstChild.nodeValue = "%compare".toLocaleString();
    document.getElementById("o_teeth").firstChild.nodeValue = "%teeth".toLocaleString();
    document.getElementById("o_development").firstChild.nodeValue = "%development".toLocaleString();
    document.getElementById("o_ratio").firstChild.nodeValue = "%ratio".toLocaleString();
    document.getElementById("o_speed").firstChild.nodeValue = "%speed".toLocaleString();
    document.getElementById("ribbon-banner").style.visibility=(("%ribbontext_top".toLocaleString()=="")?"hidden":"visible");
    document.getElementById("ribbon-link").firstChild.nodeValue = "%ribbontext_top".toLocaleString();
    document.getElementById("ribbon-link").href = "%ribbon_link".toLocaleString();
    document.getElementById("ribbon2").firstChild.nodeValue = "%ribbontext_sub".toLocaleString();
    $("#mail").html("%mail".toLocaleString());

    $("#buttonCompare").attr("title", "%tt_compare".toLocaleString());
    $("#mail").attr("title", "%tt_mail".toLocaleString());
    $(".sprocket").attr("title", "%tt_moveSp".toLocaleString());
    $(".Chainring").attr("title", "%tt_moveCw".toLocaleString());
    $("#selectWheelSize").attr("title", "%tt_wheel_size".toLocaleString());
    $("#inputCircumference").attr("title", "%tt_wheel_size".toLocaleString());
    $("#chainLineSlider").attr("title", "%tt_chain_angle".toLocaleString());
    $("#buttonCompare").attr("title", "%tt_compare".toLocaleString());
    $("#buttonCompare").attr("title", "%tt_compare".toLocaleString());
    $("#inputURL").attr("title", "%tt_url".toLocaleString());

	// get size and location of scale for cw and spr selection
	var scaleLeft = parseInt($(".scale").css("left"),10);
	var scaleWidth = parseInt($(".scale").css("width"),10) - 25;

	// paint the ticks for the scale of selectable Sprockets and chainrings (divs added to the #cwScale and #spScale)
	for ( var it=0; it<= nSelectableChainrings; it++) {
        $('<div/>', {
            'class':'scaleTick',
            'style':'left:' + Math.round(it*scaleWidth/nSelectableChainrings - 2) + 'px',
            }).appendTo('#cwScale');
    }
	for ( it=0; it<= nSelectableSprockets; it++) {
	    $('<div/>', {
	        'class':'scaleTick',
	        'id':'test',
	        'style':'left:' + Math.round(it*scaleWidth/nSelectableSprockets -2) + 'px',
	    }).appendTo('#spScale');
	}

	// get Chainring/Sprocket sets, Tire dimensions and hub data from Jason file data.json
	$.ajax({
		dataType : "json",
		url : "data.json",
		async : false
	}).done(function(data) {

		$.each(data, function(key, val) {
			if (key === "SprocketSets") {
				for (var i = 0; i < val.length; i++) {
					$('#selectBoxSprockets').append('<option value="' + val[i].set + '">' + ((i===0)?"%custom".toLocaleString():val[i].name) + '</option>');
				}
			} else if (key === 'ChainringSets') {
				for ( i = 0; i < val.length; i++) {
					$('#selectBoxChainrings').append('<option value="' + val[i].set + '">' + ((i===0)?"%custom".toLocaleString():val[i].name) + '</option>');
				}
			} else if (key === 'TireSizes') {
				for ( i = 0; i < val.length; i++) {
					$('#selectWheelSize').append('<option value="' + val[i].size + '">' + val[i].name + '</option>');
					var tire = { id:val[i].size, name:val[i].name };
					tireTypes[i] = tire;
				}
			} else if (key === 'HubData') {
				for ( i = 0; i < val.length; i++) {
					$('#selectBoxGearingType').append('<option value="' + val[i].id + '">' + ((i===0)?"%derailleurs".toLocaleString():val[i].name) + '</option>');
					//define array with description and data of hub types from json file
					var data = val[i].data.split(',');
					var ratios = data.slice(3,data.length);
					var hub = { id:val[i].id.toString(), minRatio:data.slice(0,1).toString(), chainRing:data.slice(1,2).toString(),
					    sprocket:data.slice(2,3).toString(), ratios:ratios, name:val[i].name};
					hubTypes[hubTypes.length] = hub;
					//console.log('<option value="' + val[i].id + ',' + val[i].data + '">' + val[i].name + '</option>');
				}
			}
		});

	});

	// get Chainrings and Sprockets from URL
	// example: http://www.gear-calculator.com?KB=39,53&RZ=12,13,14,15,16,17,18,19,21,23&GR=DERS&TF=85&UF=2099&SL=2
	var paramKB = getURLParameter("KB");
	var paramRZ = getURLParameter("RZ");
	var paramUF = getURLParameter("UF");
	var paramTF = getURLParameter("TF");
	var paramSL = getURLParameter("SL");
	var paramUN = getURLParameter("UN");
	var paramGR = getURLParameter("GR");
	var paramKB2 = getURLParameter("KB2");
	var paramRZ2 = getURLParameter("RZ2");
	var paramUF2 = getURLParameter("UF2");
	var paramGR2 = getURLParameter("GR2");
	var paramGT2 = getURLParameter("GT2");

	if ( paramKB !== null && paramRZ !== null ){
	    aChainrings = paramKB.split(',');
	    aChainrings.sort();
	    for ( i = aChainrings.length; i < nMaxNumberChainrings; i++){
		    aChainrings.unshift("00");
	    }
	    aSprockets   = paramRZ.split(',');
	    aSprockets.sort();
	    for ( i = aSprockets.length; i < nMaxNumberSprockets; i++){
		    aSprockets.unshift("00");
	    }
	}
	if ( paramKB2 !== null && paramRZ2 !== null ){
	    c2visible = true;
	    c2active = true;
	    aChainrings2 = paramKB2.split(',');
	    aChainrings2.sort();
	    for ( i = aChainrings2.length; i < nMaxNumberChainrings; i++){
		    aChainrings2.unshift("00");
	    }
	    aSprockets2   = paramRZ2.split(',');
	    aSprockets2.sort();
	    for ( i = aSprockets2.length; i < nMaxNumberSprockets; i++){
		    aSprockets2.unshift("00");
	    }
	}
	cadence = Number(( paramTF !== null )? paramTF : cadence);
	circumference = ( paramUF !== null )? paramUF : circumference;
	circumference2 = ( paramUF2 !== null )? paramUF2 : circumference;
	dsplOps.siUnits = (paramUN !== null)? (paramUN === "KMH") : (navigator.language !== "en");
	dsplOps.maxChainAngle = Number(( paramSL !== null )? paramSL : dsplOps.maxChainAngle);
	hubType = ( paramGR !== null )? hubTypes.getById(paramGR) : hubTypes[0];
	hubType2 = ( paramGR2 !== null )? hubTypes.getById(paramGR2) : hubTypes[0];
	hubType2 = ( paramGT2 !== null )? hubTypes.getById(paramGT2) : hubType2;

    // set controls with initial values or from URL parameters
    $('#selectWheelSize').val( (c2active)?circumference2:circumference );
    $('#inputCircumference').val((c2active)?circumference2:circumference);
 	$('#selectBoxChainrings').val(aChainrings.toString());
 	$('#selectBoxSprockets').val(aSprockets.toString());
 	$('#selectBoxGearingType').val( (c2active)?hubType2.id:hubType.id );
 	if (dsplOps.siUnits){
 	    $('#unitKmh').prop('checked',true);
 	} else {
 	    $('#unitMph').prop('checked',true);
 	}
	$("body").css("height", window.innerHeight - 16);

	function positionChainrings(chainrings, animate){
		//position Chainrings/Sprockets and place empty Chainrings/sprockets to position left=0
		for ( var i = 1; i <= chainrings.length; i++) {
			var animation = {};
			animation.left = (chainrings[i-1]>0)? Math.round((chainrings[i-1]-nMinChainringTeeth)*scaleWidth/nSelectableChainrings + scaleLeft -25 ) : 0 ;
			if (animate){
				$(".Chainring:nth-child(" + i + ")").animate( animation );
			} else {
				$(".Chainring:nth-child(" + i + ")").css( animation );
			}
			$(".Chainring:nth-child(" + i + ")").children("div").html( (chainrings[i-1]>0)? chainrings[i-1]:null);
		}
	}

	function positionSprockets(sprockets, animate){
		for ( var i = 1; i <= sprockets.length; i++) {
			var animation = {};
			animation.left = ( sprockets[i-1]>0)? Math.round((sprockets[i-1]-nMinSprocketTeeth)*scaleWidth/nSelectableSprockets + scaleLeft -25 ) : 0;
			if (animate) {
				$(".sprocket:nth-child(" + i + ")").animate( animation );
			} else {
				$(".sprocket:nth-child(" + i + ")").css( animation );
			}
			$(".sprocket:nth-child(" + i + ")").children("div").html( (sprockets[i-1]>0)? sprockets[i-1] : null );
		}
	}

	// make the Chainrings movable
	$(".Chainring").draggable({ axis: "x", containment: "parent" });
	// create Slider for cadence selection
	$( "#cadenceSlider" ).slider({ min: 40 , max: 140, step: 1});
	$( "#cadenceSlider" ).slider( "value", cadence);
	$( "#cadenceValue" ).html( cadence );
	$( "#cross_minSlider" ).slider({ min: 1 , max: 100, step: 0.1});
	$( "#cross_minSlider" ).slider( "value", cross_min);
	$( "#cross_minValue" ).html( cross_min );
	$( "#cross_maxSlider" ).slider({ min: 1 , max: 100, step: 0.1});
	$( "#cross_maxSlider" ).slider( "value", cross_max);
	$( "#cross_maxValue" ).html( cross_max );
	$( "#cross_sSlider" ).slider({ min: 1 , max: 6, step: 1});
	$( "#cross_sSlider" ).slider( "value", cross_s);
	$( "#cross_sValue" ).html( cross_s );
	$( "#cadencedSlider" ).slider({ min: 1 , max: 20, step: 1});
	$( "#cadencedSlider" ).slider( "value", cadenced);
	$( "#cadencedValue" ).html( cadenced );
		// event handler for cadence slider
	$("#cadenceSlider").on( "slide", function( event, ui ) {
			//console.log($("#slider").slider("value"));
			cadence = ui.value;
				//cadence = $("#cadenceSlider").slider("value");
				$("#cadenceValue").html( cadence );
		var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
		var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
				updateGraphics(canvas, canvas2, gearSet, gearSet2);
		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
		});

		$("#cadencedSlider").on( "slide", function( event, ui ) {
				//console.log($("#slider").slider("value"));
				cadenced = ui.value;
					//cadence = $("#cadenceSlider").slider("value");
					$("#cadencedValue").html( cadenced );
			var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
			var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
					updateGraphics(canvas, canvas2, gearSet, gearSet2);
			$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
			});
			$("#cross_minSlider").on( "slide", function( event, ui ) {
					//console.log($("#slider").slider("value"));
					cross_min = ui.value;
						//cadence = $("#cadenceSlider").slider("value");
						$("#cross_minValue").html( cross_min );
				var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
				var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
						updateGraphics(canvas, canvas2, gearSet, gearSet2);
				$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
				});
				$("#cross_maxSlider").on( "slide", function( event, ui ) {
						//console.log($("#slider").slider("value"));
						cross_max = ui.value;
							//cadence = $("#cadenceSlider").slider("value");
							$("#cross_maxValue").html( cross_max );
					var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
					var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
							updateGraphics(canvas, canvas2, gearSet, gearSet2);
					$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
					});
					$("#cross_sSlider").on( "slide", function( event, ui ) {
							//console.log($("#slider").slider("value"));
							cross_s = ui.value;
								//cadence = $("#cadenceSlider").slider("value");
								$("#cross_sValue").html( cross_s );
						var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
						var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
								updateGraphics(canvas, canvas2, gearSet, gearSet2);
						$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
						});
	// draw graphics in canvas element
	var canvas = $("#myCanvas")[0]; //[0] gets the first element from the selector's collection
	if (canvas.getContext){
		// take width and height for canvas area from CSS for #myCanvas
		canvas.width = parseInt($("#myCanvas").css("width"),10);
		canvas.height = parseInt($("#myCanvas").css("height"),10);
		gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
		drawGraphics(canvas, gearSet, gearSet.minDev, gearSet.maxDev, cadence, dsplOps);
	    // position first set of Chainrings and Sprockets
	    positionChainrings(aChainrings, true);
	    positionSprockets(aSprockets, true);
	}
	if (c2visible){
		// draw second canvas
		canvas2 = $("#myCanvas2")[0];
		if (canvas2.getContext){
		// take width and height for canvas area from CSS for #myCanvas
			canvas2.width = parseInt($("#myCanvas").css("width"), 10);
			canvas2.height = parseInt($("#myCanvas").css("height"),10);
			gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
			drawBothGraphics(canvas, canvas2, gearSet, gearSet2, cadence, dsplOps);
		}
		// display canvas2 and scroll it down
		$("#myCanvas2").show();
		$("#myCanvas2").animate( {top: 0});
		$("#myCanvas2").css('outline', '2px solid #f06529');
		$("#myCanvas").css('outline', 'none');
		c2active = true;
	    positionChainrings(aChainrings2, true);
	    positionSprockets(aSprockets2, true);
	}
    $("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));


	// event handler while dragging a Chainring
	var oldTick = 0;
	$(".Chainring").on( "drag", function( event, ui ) {
		// calculate nearest tick on scale
		var nPosition = ui.position.left - scaleLeft + scaleWidth/nSelectableChainrings;
		var nTick = Math.round(nPosition/scaleWidth*nSelectableChainrings);
		//display the current teeth;
		if (nTick !== oldTick){
			oldTick = nTick;
			// get which Chainrings is moved (from id "cwX")
			var iChainring = $(this).attr("id").substring(2,3) - 1 ;
			//console.log( "CW: " + iChainring + " tick:" + nTick);
			if ( nTick >= 0 ){
				$(this).children("div").html(nTick + nMinChainringTeeth);
				if (c2active){
					aChainrings2[iChainring] = nTick + nMinChainringTeeth;
				} else {
					aChainrings[iChainring] = nTick + nMinChainringTeeth;
				}
			} else {
				$(this).children("div").html("");
				if (c2active){
					aChainrings2[iChainring] = 0;
				} else {
					aChainrings[iChainring] = 0;
				}
			}
			var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
			var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
            updateGraphics(canvas, canvas2, gearSet, gearSet2);
            // set Select Box according to current Chainrings
			$('#selectBoxChainrings').val(((!c2active)? aChainrings.slice(0) : aChainrings2.slice(0)).sort().toString());
		    $("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
		}
	} );

	// event handler for the drop (=dragstop) of a Chainring: put the Chainring icon onto the nearest tick
	$(".Chainring").on( "dragstop", function( event, ui ) {
		// calculate nearest tick on scale
		var nPosition = ui.position.left - scaleLeft + scaleWidth/nSelectableChainrings;
		var nTick = Math.round( nPosition/scaleWidth*nSelectableChainrings );
		//move ring to the nearest tick or place on left side
		if ( nTick >= 0){
			$(this).css("left", Math.round(nTick*scaleWidth/nSelectableChainrings + scaleLeft -25));
			$(this).children("div").html(nTick + nMinChainringTeeth);
		} else {
			$(this).css("left", 0 );
			$(this).children("div").html( "" );
		}
	});

	// make the Sprockets movable
	$(".sprocket").draggable({ axis: "x", containment: "parent" });

	// event handler while dragging a Sprocket
	$(".sprocket").on( "drag", function( event, ui ) {
		// calculate nearest tick on scale
		var nPosition = ui.position.left - scaleLeft + scaleWidth/nSelectableSprockets;
		var nTick = Math.round(nPosition/scaleWidth*nSelectableSprockets);
		var iSprocket = $(this).attr("id").substring(2,4) - 1 ;
		if (nTick !== oldTick){
			//console.log("pos: " + nTick);
			oldTick=nTick;
			if ( nTick >= 0){
				$(this).children("div").html(nTick + nMinSprocketTeeth);
				if(c2active){
					aSprockets2[iSprocket] = nTick + nMinSprocketTeeth;
				} else {
					aSprockets[iSprocket] = nTick + nMinSprocketTeeth;
				}
			} else {
				$(this).children("div").html("");
				if(c2active){
					aSprockets2[iSprocket] = 0;
				} else {
					aSprockets[iSprocket] = 0;
				}
			}
			var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
			var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
            updateGraphics(canvas, canvas2, gearSet, gearSet2);
			// set Select Box according to current Sprockets
			$('#selectBoxSprockets').val(((!c2active)? aSprockets.slice(0) : aSprockets2.slice(0)).sort().toString());
		    $("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
		}
	} );

	// event handler for the drop (=dragstop) of a Sprocket: put the Sprocket icon onto the nearest scale tick
	$(".sprocket").on( "dragstop", function( event, ui ) {
		// calculate nearest tick on scale
		var nPosition = ui.position.left - scaleLeft + scaleWidth/nSelectableSprockets;
		var nTick = Math.round( nPosition/scaleWidth*nSelectableSprockets );
		//move ring to the nearest tick or place on left side
		if ( nTick >= 0){
			$(this).css("left", Math.round(nTick*scaleWidth/nSelectableSprockets + scaleLeft -25) );
			$(this).children("div").html(nTick + nMinSprocketTeeth );
		} else {
			$(this).css("left", 0 );
			$(this).children("div").html( "" );
		}

	} );

	$("#myCanvas2").click( function(){
		c2active = true;
		positionChainrings(aChainrings2);
		positionSprockets(aSprockets2);
		$(this).css('outline', '2px solid #f06529');
		$("#myCanvas").css('outline', 'none');
 	    $('#selectBoxGearingType').val( hubType2.id );
 	    $('#selectWheelSize').val(circumference2);
    	$('#inputCircumference').val(circumference2);
		$('#selectBoxChainrings').val((aChainrings2.slice(0)).sort().toString());
		$('#selectBoxSprockets').val((aSprockets2.slice(0)).sort().toString());
		if (gearSet2.isGearHub){
   				$("#selectBoxChainrings").prop('disabled', 'disabled');
   				$("#selectBoxSprockets").prop('disabled', 'disabled');
		} else {
   				$("#selectBoxChainrings").prop('disabled', false);
   				$("#selectBoxSprockets").prop('disabled', false);
		}
	});

	$("#myCanvas").click( function(){
		c2active = false;
		positionChainrings(aChainrings);
		positionSprockets(aSprockets);
 	    $('#selectBoxGearingType').val( hubType.id );
 	    $('#selectWheelSize').val(circumference);
    	$('#inputCircumference').val(circumference);
		$('#selectBoxChainrings').val((aChainrings.slice(0)).sort().toString());
		$('#selectBoxSprockets').val((aSprockets.slice(0)).sort().toString());
		if (c2visible){
			$(this).css('outline', '2px solid #f06529');
		    $("#myCanvas2").css('outline', 'none');
		}
		if (gearSet.isGearHub){
   				$("#selectBoxChainrings").prop('disabled', 'disabled');
   				$("#selectBoxSprockets").prop('disabled', 'disabled');
		} else {
   				$("#selectBoxChainrings").prop('disabled', false);
   				$("#selectBoxSprockets").prop('disabled', false);
		}
	});


	$('#buttonCompare').click(function(){
		if (!c2visible){
			aChainrings2 = aChainrings.slice(0);
			aSprockets2 = aSprockets.slice(0);
			circumference2 = circumference;
			hubType2 = {id:hubType.id, ratios:hubType.ratios, chainRingl:hubType.chainRing, sprocket:hubType.sprocket, name:hubType.name};
			// draw second canvas
			canvas2 = $("#myCanvas2")[0];
			if (canvas2.getContext){
			// take width and height for canvas area from CSS for #myCanvas
				canvas2.width = parseInt($("#myCanvas").css("width"), 10);
				canvas2.height = parseInt($("#myCanvas").css("height"),10);
				gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType );
				gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
				drawBothGraphics(canvas, canvas2, gearSet, gearSet2, cadence, dsplOps);
			}
			// display canvas2 and scroll it down
			$("#myCanvas2").show();
			$("#myCanvas2").animate( {top: 0});
			$("#myCanvas2").css('outline', '2px solid #f06529');
			$("#myCanvas").css('outline', 'none');
			c2visible = true;
			c2active = true;
		} else {
		    if (c2active){
		        aChainrings = aChainrings2.slice(0);
		        aSprockets = aSprockets2.slice();
		        circumference = circumference2;
		        hubType = hubType2;
			    var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
			    var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
                updateGraphics(canvas, canvas2, gearSet, gearSet2);
		    }else{

		    }
			// scroll up Canvas2 and hide it
			$("#myCanvas2").animate( {top: -240}, function(){$("#myCanvas2").hide();});
			c2visible = false;
			c2active = false;
			$("#myCanvas2").css('outline', 'none');
			$("#myCanvas").css('outline', 'none');
 	        $('#selectBoxGearingType').val( hubType.id );
		}
		//$("#inputURL").val( createURL(new GearSet(aChainrings, aSprockets, circumference, hubType), new GearSet(aChainrings2, aSprockets2, circumference, hubType2), cadence, dsplOps));
 		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
   });


	$('#selectBoxGearingType').change(function(){
		if (c2active){
            hubType2 = hubTypes.getById($('#selectBoxGearingType option:selected').val());
    		if (hubType2.id !== "DERS"){
    			aCopyChainrings2 = aChainrings2.slice(0);
    			aCopySprockets2 = aSprockets2.slice(0);
    			aChainrings2 = [hubType2.chainRing];
    			for (var i = 1; i < nMaxNumberChainrings; i++){
    				aChainrings2.push( "00" );
    			}
    			aSprockets2 = [hubType2.sprocket];
    			for ( i = 1; i < nMaxNumberSprockets; i++){
    				aSprockets2.push("00");
    			}
    			positionChainrings(aChainrings2);
    			positionSprockets(aSprockets2);
  				$("#selectBoxChainrings").prop('disabled', 'disabled');
    			$("#selectBoxSprockets").prop('disabled', 'disabled');
	    	    $('#selectBoxSprockets').val("");
	    	    $('#selectBoxChainrings').val("");
    		} else {
    			aChainrings2 = aCopyChainrings2.slice(0);
    			aSprockets2= aCopySprockets2.slice(0);
   				$("#selectBoxChainrings").prop('disabled', false);
   				$("#selectBoxSprockets").prop('disabled', false);
	    	    $('#selectBoxSprockets').val(aSprockets2.toString());
	    	    $('#selectBoxChainrings').val(aChainrings2.toString());
    			positionChainrings(aChainrings2);
    			positionSprockets(aSprockets2);
      		}
		} else {
            hubType = hubTypes.getById($('#selectBoxGearingType option:selected').val());
    		if (hubType.id !== "DERS"){
    			aCopyChainrings = aChainrings.slice(0);
    			aCopySprockets = aSprockets.slice(0);
    			aChainrings = [hubType.chainRing];
    			for ( i = 1; i < nMaxNumberChainrings; i++){
    				aChainrings.push( "00" );
    			}
    			//aSprockets = hubData.slice(3,4);
    			aSprockets = [ hubType.sprocket ];
    			for ( i = 1; i < nMaxNumberSprockets; i++){
    			    aSprockets.push("00");
    			}
    			positionChainrings(aChainrings);
    			positionSprockets(aSprockets);
   				$("#selectBoxChainrings").prop('disabled', 'disabled');
    			$("#selectBoxSprockets").prop('disabled', 'disabled');
	    	    $('#selectBoxSprockets').val("");
	    	    $('#selectBoxChainrings').val("");
    		} else {
    			aChainrings = aCopyChainrings.slice(0);
    			aSprockets = aCopySprockets.slice(0);
   				$("#selectBoxChainrings").prop('disabled', false);
   				$("#selectBoxSprockets").prop('disabled', false);
	    	    $('#selectBoxSprockets').val(aSprockets.toString());
	    	    $('#selectBoxChainrings').val(aChainrings.toString());
    			positionChainrings(aChainrings);
    			positionSprockets(aSprockets);
   			}
      	}

		var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
		var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
        updateGraphics(canvas, canvas2, gearSet, gearSet2);
		//positionSprockets(aSprockets);
		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
    });


	$('#selectBoxSprockets').change(function(){
		if (c2active) {
			aSprockets2 = $('#selectBoxSprockets option:selected').val().split(',') ;
		} else {
    		aSprockets   = $('#selectBoxSprockets option:selected').val().split(',') ;
    	}
		var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
		var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
        updateGraphics(canvas, canvas2, gearSet, gearSet2);
		positionSprockets((c2active)?aSprockets2:aSprockets, true);
 		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
   });

 	$('#selectBoxChainrings').change(function(){
 		if (c2active) {
	    	aChainrings2   = $('#selectBoxChainrings option:selected').val().split(',') ;
	    } else {
	    	aChainrings   = $('#selectBoxChainrings option:selected').val().split(',') ;
	    }
		var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
		var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
        updateGraphics(canvas, canvas2, gearSet, gearSet2);
		positionChainrings((c2active)?aChainrings2:aChainrings, true);
		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
    });

 	$('#selectWheelSize').change(function(){
 		if (c2active) {
            circumference2   = $('#selectWheelSize option:selected').val();
    	    $('#inputCircumference').val(circumference2);
 		} else {
 		    circumference   = $('#selectWheelSize option:selected').val();
    	    $('#inputCircumference').val(circumference);
 		}
		var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
		var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
        updateGraphics(canvas, canvas2, gearSet, gearSet2);
		//positionChainrings(aChainrings);
 		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
   });

 	$('#inputCircumference').change(function(){
  		if (c2active) {
            circumference2   = $('#inputCircumference').val();
    	    $('#selectWheelSize').val(circumference2);
 		} else {
 		    circumference   = $('#inputCircumference').val();
    	    $('#selectWheelSize').val(circumference);
 		}
		var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
		var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
        updateGraphics(canvas, canvas2, gearSet, gearSet2);
 		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
    });


 	$('#selectDisplay').change(function(){
    	dsplOps.values = $('#displaySelect option:selected').val();
		var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
		var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
        updateGraphics(canvas, canvas2, gearSet, gearSet2);
    });

    $( "input[name=units]:radio" ).change(function(){
        dsplOps.siUnits = ($("input[name=units]:checked").val() === 'kmh');
		var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
		var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference, hubType2);
        updateGraphics(canvas, canvas2, gearSet, gearSet2);
		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
    });

	$("#close_ribbon").click( function(){
        $("#ribbon-banner").hide();
	});

	//create slider for max allowed chain angle
    $( "#chainLineSlider" ).slider({ min: 1.50 , max: 3.50, step: 0.1 });
    $( "#chainLineSlider" ).slider( "value", dsplOps.maxChainAngle);
	$( "#chainAngleValue" ).html( dsplOps.maxChainAngle.toPrecision(2) +'&deg;');
    // event handler for max allowe dchain angle
    $( "#chainLineSlider" ).on( "slide", function( event, ui ) {
    	//console.log($("#slider").slider("value"));
    	//dsplOps.maxChainAngle = $("#chainLineSlider").slider("value");
    	dsplOps.maxChainAngle = ui.value;
    	$( "#chainAngleValue" ).html( dsplOps.maxChainAngle.toPrecision(2) +'&deg;' );
		var gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
		var gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
        updateGraphics(canvas, canvas2, gearSet, gearSet2);
		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
    });

});
