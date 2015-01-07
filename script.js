// Constants
var nMaxChainringTeeth = 64;
var nMinChainringTeeth = 20;
var nSelectableChainrings = nMaxChainringTeeth - nMinChainringTeeth;
var nMaxNumberChainrings = 3;
	
var nMaxSprocketTeeth = 42;
var nMinSprocketTeeth = 9;
var nSelectableSprockets = nMaxSprocketTeeth - nMinSprocketTeeth;
var nMaxNumberSprockets = 11;

var aChainrings = ["00", "39", "53"];
var aSprockets = ["00","11","12","13","14","15","17","19","21","24","28"];
var aChainrings2 = ["00", "39", "53"];
var aSprockets2 = ["00","11","12","13","14","15","17","19","21","24","28"];
var aCopyChainrings = ["00", "39", "53"];
var aCopySprockets = ["00","11","12","13","14","15","17","19","21","24","27"];
var aCopyChainrings2 = ["00", "39", "53"];
var aCopySprockets2 = ["00","11","12","13","14","15","17","19","21","24","28"];

var gearSet = {};
var gearSet2 = {};

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


var circumference = "2100";
var circumference2 = "2100";
var cadence = 90;
var distSprockets = [5.5, 5.5, 5.5, 5.5, 5.3, 5.0, 5.0, 4.8, 4.34, 3.95, 3.9]; //distance/mm between sprockets 
var distChainrings = 5.0;
// object for storing display options:
var dsplOps = { siUnits:true, values:"teeth", maxChainAngle:2.5};

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
	return this;
};


function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

function createURL(gearSet, gearSet2, cadence, dsplOps){
    var url = location.origin + location.pathname + "?GR=" + gearSet.GearType + "&KB=" + gearSet.Chainrings +"&RZ=" + gearSet.Cogs + "&UF=" + gearSet.circumference 
        + "&TF=" + cadence + "&SL=" + dsplOps.maxChainAngle + "&UN=" + ((dsplOps.siUnits)?"KMH":"MPH"); 
    if ( c2active ) {
        url = url + "&GR2=" + gearSet2.GearType + "&KB2=" + gearSet2.Chainrings + "&RZ2=" + gearSet2.Cogs + "&UF2=" + gearSet2.circumference;
    }
    return url;
//  http://www.ritzelrechner.de/#KB=39,53&RZ=12,13,14,15,16,17,18,19,21,23&GR=DERS&KB2=39,53&RZ2=12,13,14,15,16,17,18,19,21,23&GT2=DERS&UF2=2099&TF=85&UF=2099&SL=2
}

function drawBothGraphics(canvas, canvas2, gearSet, gearSet2, cadence, dsplOps) {

	var minRatio = Math.min(gearSet.Ratios[0][gearSet.Cogs.length - 1] * gearSet.HubGears[0], 
		                    gearSet2.Ratios[0][gearSet2.Cogs.length - 1] * gearSet2.HubGears[0]);
	var maxRatio = Math.max(gearSet.Ratios[gearSet.Chainrings.length - 1][0] * gearSet.HubGears[gearSet.HubGears.length - 1],
		                    gearSet2.Ratios[gearSet2.Chainrings.length - 1][0] * gearSet2.HubGears[gearSet2.HubGears.length - 1]);
	
	drawGraphics(canvas, gearSet, minRatio, maxRatio, cadence, dsplOps);			 
	drawGraphics(canvas2, gearSet2, minRatio, maxRatio, cadence, dsplOps);
}



// Document ready for initializing the screen and defining the event handlers using jQuery 
$(document).ready( function() {	
	
    // Localization of HTML elements with l10n.js library and localization.js file
    document.getElementById("l_gearing").firstChild.nodeValue = "%gearing".toLocaleString();
    document.getElementById("l_chainrings").firstChild.nodeValue = "%chainrings".toLocaleString();
    document.getElementById("l_sprockets").firstChild.nodeValue = "%sprockets".toLocaleString();
    document.getElementById("l_wheel_size").firstChild.nodeValue = "%wheel_size".toLocaleString();
    //document.getElementById("l_circumference").firstChild.nodeValue = "%circumference".toLocaleString();
    document.getElementById("l_display").firstChild.nodeValue = "%display".toLocaleString();
    document.getElementById("l_cadence").firstChild.nodeValue = "%cadence".toLocaleString();
    document.getElementById("l_chain_angle").firstChild.nodeValue = "%chain_angle".toLocaleString();
    document.getElementById("l_units").firstChild.nodeValue = "%units".toLocaleString();
    document.getElementById("buttonCompare").firstChild.nodeValue = "%compare".toLocaleString();
    document.getElementById("o_teeth").firstChild.nodeValue = "%teeth".toLocaleString();
    document.getElementById("o_development").firstChild.nodeValue = "%development".toLocaleString();
    document.getElementById("o_ratio").firstChild.nodeValue = "%ratio".toLocaleString();
    document.getElementById("o_speed").firstChild.nodeValue = "%speed".toLocaleString();


	// get size and location of scale for cw and spr selection
	var scaleLeft = parseInt($(".scale").css("left"),10);
	var scaleWidth = parseInt($(".scale").css("width"),10) - 25;

	// paint the ticks for the scale of selectable Sprockets and chainrings (divs added to the scale areas)
	for ( var it=0; it<= nSelectableChainrings; it++) {
		var xTick = (it*scaleWidth/nSelectableChainrings - 2);
		$("#cwScale").append('<div class="scaleTick" style="left:' + xTick + 'px"></div>');
		//$("#cwScale div:nth-child(" + it + ")").css( "left", xTick );
	}

	for ( it=0; it<= nSelectableSprockets; it++) {
		xTick = it*scaleWidth/nSelectableSprockets - 2;
		$("#spScale").append('<div class="scaleTick" style="left:' + xTick + 'px"></div>');
		//$("#spScale div:nth-child(" + it + ")").css( "left", xTick );
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
					$('#selectBoxSprockets').append('<option value="' + val[i].set + '">' + val[i].name + '</option>');
				}
			} else if (key === 'ChainringSets') {
				for ( i = 0; i < val.length; i++) {
					$('#selectBoxChainrings').append('<option value="' + val[i].set + '">' + val[i].name + '</option>');
				}
			} else if (key === 'TireSizes') {
				for ( i = 0; i < val.length; i++) {
					$('#selectWheelSize').append('<option value="' + val[i].size + '">' + val[i].name + '</option>');
				}
			} else if (key === 'HubData') {
				for ( i = 0; i < val.length; i++) {
					$('#selectBoxGearingType').append('<option value="' + val[i].id + '">' + ((i===0)?"%derailleurs".toLocaleString():val[i].name) + '</option>');
					//define array with description and data of hub types from json file
					var data = val[i].data.split(',');
					var ratios = data.slice(3,data.length);
					var hub = { id:val[i].id.toString(), minRatio:data.slice(0,1).toString(), chainWheel:data.slice(1,2).toString(), 
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
	cadence = ( paramTF !== null )? paramTF : cadence;
	circumference = ( paramUF !== null )? paramUF : circumference;
	circumference2 = ( paramUF2 !== null )? paramUF2 : circumference;
	dsplOps.siUnits = (paramUN !== null)? (paramUN === "KMH") : (navigator.language !== "en"); 
	dsplOps.maxChainAngle = ( paramSL !== null )? paramSL : dsplOps.maxChainAngle;
	hubType = ( paramGR !== null )? hubTypes.getById(paramGR) : hubTypes[0];
	hubType2 = ( paramGR2 !== null )? hubTypes.getById(paramGR2) : hubTypes[0];
	//hubType = hubTypes[0];
	
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
			animation.left = (chainrings[i-1]>0)? (chainrings[i-1]-nMinChainringTeeth)*scaleWidth/nSelectableChainrings + scaleLeft -25 : 0 ;
			if (animate){
				$(".Chainring:nth-child(" + i + ")").animate( animation );
			} else {
				$(".Chainring:nth-child(" + i + ")").css( animation );
			}
			//$(".Chainring:nth-child(" + i + ")").css("left", (aChainrings[i-1]>0)? (aChainrings[i-1]-nMinChainringTeeth)*scaleWidth/nSelectableChainrings + scaleLeft -25 : 0 );
			$(".Chainring:nth-child(" + i + ")").children("div").html( (chainrings[i-1]>0)? chainrings[i-1]:null);
		}
	}	

	function positionSprockets(sprockets, animate){
		for ( var i = 1; i <= sprockets.length; i++) {
			var animation = {};
			animation.left = ( sprockets[i-1]>0)? (sprockets[i-1]-nMinSprocketTeeth)*scaleWidth/nSelectableSprockets + scaleLeft -25 : 0;
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
	// paint the ticks for the scale of selectable Chainrings
	for ( i=0; i<= nSelectableChainrings; i++) {
		var xTick = i*scaleWidth/nSelectableChainrings - 2;
		$("#cwScale").append('<div class="scaleTick"></div>');
		$("#cwScale div:nth-child(" + i + ")").css( "left", xTick );
	}
	
	
	// draw graphics in canvas element
	var canvas = $("#myCanvas")[0]; //[0] gets the first element from the selector's collection
	if (canvas.getContext){
		// take width and height for canvas area from CSS for #myCanvas 
		canvas.width = parseInt($("#myCanvas").css("width"),10);	 
		canvas.height = parseInt($("#myCanvas").css("height"),10);	 
		gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
		drawGraphics(canvas, gearSet, gearSet.Ratios[0][gearSet.Cogs.length-1]*gearSet.HubGears[0], 
	        gearSet.Ratios[gearSet.Chainrings.length-1][0]*gearSet.HubGears[gearSet.HubGears.length-1], cadence, dsplOps);			 
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
		$("#myCanvas2").css('outline', '2px solid yellow');
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
			if (canvas.getContext){
				gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
				if(c2visible && canvas2.getContext){					
					gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
					drawBothGraphics(canvas, canvas2, gearSet, gearSet2,  cadence, dsplOps);
				} else {
					drawGraphics(canvas, gearSet, gearSet.Ratios[0][gearSet.Cogs.length-1]*gearSet.HubGears[0], 
				         		gearSet.Ratios[gearSet.Chainrings.length-1][0]*gearSet.HubGears[gearSet.HubGears.length-1],  
				         		cadence, dsplOps);			 
				}			 
			}
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
		// get which Chainrings is moved (from id "cwX")
		//var iChainring = $(this).attr("id").substring(2,3) - 1 ;
		//move ring to the nearest tick or place on left side
		if ( nTick >= 0){
			$(this).css("left", nTick*scaleWidth/nSelectableChainrings + scaleLeft -25);
			$(this).children("div").html(nTick + nMinChainringTeeth);
		} else {
			$(this).css("left", 0 );
			$(this).children("div").html( "" );
		}
	});
	
	// make the Sprockets movable
	$(".sprocket").draggable({ axis: "x", containment: "parent" });
	// paint the ticks for the scale of selectable Sprockets
	for ( i=0; i<= nSelectableSprockets; i++) {
		xTick = i*scaleWidth/nSelectableSprockets - 2;
		$("#spScale").append('<div class="scaleTick"></div>');
		$("#spScale div:nth-child(" + i + ")").css( "left", xTick );
	}
	
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
			if (canvas.getContext){
				gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
				if(c2visible && canvas2.getContext){					
					gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
					drawBothGraphics(canvas, canvas2, gearSet, gearSet2, cadence, dsplOps);
				} else {
					drawGraphics(canvas, gearSet, gearSet.Ratios[0][gearSet.Cogs.length-1]*gearSet.HubGears[0], 
				         		gearSet.Ratios[gearSet.Chainrings.length-1][0]*gearSet.HubGears[gearSet.HubGears.length-1],  
				         		cadence, dsplOps);			 
				}			 
			}
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
		// get which Sprocket is moved (from id "spXX")
		//var iSprocket = $(this).attr("id").substring(2,4) - 1 ;
		//move ring to the nearest tick or place on left side
		if ( nTick >= 0){
			$(this).css("left", nTick*scaleWidth/nSelectableSprockets + scaleLeft -25 );
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
		$(this).css('outline', '2px solid yellow');		
		$("#myCanvas").css('outline', 'none');
 	    $('#selectBoxGearingType').val( hubType2.id );
 	    $('#selectWheelSize').val(gearSet2.circumference);
    	$('#inputCircumference').val(gearSet2.circumference);
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
 	    $('#selectWheelSize').val(gearSet.circumference);
    	$('#inputCircumference').val(gearSet.circumference);
		$('#selectBoxChainrings').val((aChainrings.slice(0)).sort().toString());
		$('#selectBoxSprockets').val((aSprockets.slice(0)).sort().toString());
		if (c2visible){
			$(this).css('outline', '2px solid yellow');		
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
			hubType2 = {id:hubType.id, ratios:hubType.ratios, chainWheel:hubType.chainWheel, sprocket:hubType.sprocket, name:hubType.name};
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
			$("#myCanvas2").css('outline', '2px solid yellow');
			$("#myCanvas").css('outline', 'none');
			c2visible = true;
			c2active = true;
		} else {
			// scroll up Canvas2 and hide it
			$("#myCanvas2").animate( {top: -240}, function(){$("#myCanvas2").hide();});
			c2visible = false;
			c2active = false;
			$("#myCanvas2").css('outline', 'none');
			$("#myCanvas").css('outline', 'none');
 	        $('#selectBoxGearingType').val( hubType.id );
		}
 		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
   });
	
 
	$('#selectBoxGearingType').change(function(){
		if (c2active){
            hubType2 = hubTypes.getById($('#selectBoxGearingType option:selected').val());
    		if (hubType2.id !== "DERS"){
    			aCopyChainrings2 = aChainrings2.slice(0);
    			aCopySprockets2 = aSprockets2.slice(0);
    			aChainrings2 = [hubType2.chainWheel];
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
    			aChainrings = [hubType.chainWheel];
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
      	
		gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
		if(c2visible && canvas2.getContext){					
			gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
			drawBothGraphics(canvas, canvas2, gearSet, gearSet2, cadence, dsplOps);
		} else {
			drawGraphics(canvas, gearSet, gearSet.Ratios[0][gearSet.Cogs.length-1]*gearSet.HubGears[0], 
				         gearSet.Ratios[gearSet.Chainrings.length-1][0]*gearSet.HubGears[gearSet.HubGears.length-1],  
				         cadence, dsplOps);			 
		}			 
		//positionSprockets(aSprockets);
		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
    });
   

	$('#selectBoxSprockets').change(function(){
		if (c2active) {
			aSprockets2 = $('#selectBoxSprockets option:selected').val().split(',') ;
		} else {
    		aSprockets   = $('#selectBoxSprockets option:selected').val().split(',') ;
    	}
				gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
				if(c2visible && canvas2.getContext){					
					gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
					drawBothGraphics(canvas, canvas2, gearSet, gearSet2, cadence, dsplOps);
				} else {
					drawGraphics(canvas, gearSet, gearSet.Ratios[0][gearSet.Cogs.length-1]*gearSet.HubGears[0], 
				         	gearSet.Ratios[gearSet.Chainrings.length-1][0]*gearSet.HubGears[gearSet.HubGears.length-1],  
				         	cadence, dsplOps);			 
				}			 
		positionSprockets((c2active)?aSprockets2:aSprockets, true);
 		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
   });
 
 	$('#selectBoxChainrings').change(function(){
 		if (c2active) {
	    	aChainrings2   = $('#selectBoxChainrings option:selected').val().split(',') ;
	    } else {
	    	aChainrings   = $('#selectBoxChainrings option:selected').val().split(',') ;
	    }
				gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
				if(c2visible && canvas2.getContext){					
					gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
					drawBothGraphics(canvas, canvas2, gearSet, gearSet2, cadence, dsplOps);
				} else {
					drawGraphics(canvas, gearSet, gearSet.Ratios[0][gearSet.Cogs.length-1]*gearSet.HubGears[0], 
				         		gearSet.Ratios[gearSet.Chainrings.length-1][0]*gearSet.HubGears[gearSet.HubGears.length-1],  
				         		cadence, dsplOps );			 
				}			 
		positionChainrings((c2active)?aChainrings2:aChainrings, true);
		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
    });

 	$('#selectWheelSize').change(function(){
 		if (c2active) {
            circumference2   = $('#selectWheelSize option:selected').val();
 		} else {
 		    circumference   = $('#selectWheelSize option:selected').val();
 		}
    	$('#inputCircumference').val(circumference);
		gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType );
		if(c2visible && canvas2.getContext){					
			gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
			drawBothGraphics(canvas, canvas2, gearSet, gearSet2, cadence, dsplOps);
		} else {
			drawGraphics(canvas, gearSet, gearSet.Ratios[0][gearSet.Cogs.length-1]*gearSet.HubGears[0], 
		         		gearSet.Ratios[gearSet.Chainrings.length-1][0]*gearSet.HubGears[gearSet.HubGears.length-1],  
		         		cadence, dsplOps);			 
		}			 
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
		gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType );
		if(c2visible && canvas2.getContext){					
			gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
			drawBothGraphics(canvas, canvas2, gearSet, gearSet2, cadence, dsplOps);
		} else {
			drawGraphics(canvas, gearSet, gearSet.Ratios[0][gearSet.Cogs.length-1]*gearSet.HubGears[0], 
		         		gearSet.Ratios[gearSet.Chainrings.length-1][0]*gearSet.HubGears[gearSet.HubGears.length-1],  
		         		cadence, dsplOps);			 
		}			 
    });


 	$('#selectDisplay').change(function(){
    	dsplOps.values = $('#displaySelect option:selected').val();
				gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType );
				if(c2visible && canvas2.getContext){					
					gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
					drawBothGraphics(canvas, canvas2, gearSet, gearSet2, cadence, dsplOps);
				} else {
					drawGraphics(canvas, gearSet, gearSet.Ratios[0][gearSet.Cogs.length-1]*gearSet.HubGears[0], 
				         		gearSet.Ratios[gearSet.Chainrings.length-1][0]*gearSet.HubGears[gearSet.HubGears.length-1],  
				         	    cadence, dsplOps);			 
				}			 
    });
       
    $( "input[name=units]:radio" ).change(function(){
        dsplOps.siUnits = ($("input[name=units]:checked").val() === 'kmh');
		if(c2visible && canvas2.getContext){					
			gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
			drawBothGraphics(canvas, canvas2, gearSet, gearSet2, cadence, dsplOps);
		} else {
			drawGraphics(canvas, gearSet, gearSet.Ratios[0][gearSet.Cogs.length-1]*gearSet.HubGears[0], 
				         gearSet.Ratios[gearSet.Chainrings.length-1][0]*gearSet.HubGears[gearSet.HubGears.length-1],  
				         cadence, dsplOps);			 
		}
		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
    });

 	// create Slider for cadence selection
 	$( "#cadenceSlider" ).slider({ min: 60 , max: 120, step: 1 });
    $( "#cadenceSlider" ).slider( "value", 90);
	$( "#cadenceValue" ).html( cadence );
    // event handler for cadence slider
	$("#cadenceSlider").on( "slide", function( event, ui ) {
    	//console.log($("#slider").slider("value"));
        cadence = $("#cadenceSlider").slider("value");
        $("#cadenceValue").html( cadence );
		gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType);
		if(c2visible && canvas2.getContext){					
			gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
			drawBothGraphics(canvas, canvas2, gearSet, gearSet2, cadence, dsplOps);
		} else {
			drawGraphics(canvas, gearSet, gearSet.Ratios[0][gearSet.Cogs.length-1]*gearSet.HubGears[0], 
				         gearSet.Ratios[gearSet.Chainrings.length-1][0]*gearSet.HubGears[gearSet.HubGears.length-1],  
				         cadence, dsplOps);			 
		}			 
		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
    });
	
	//create slider for max allowed chain angle 
    $( "#chainLineSlider" ).slider({ min: 1.5 , max: 3.5, step: 0.1 });
    $( "#chainLineSlider" ).slider( "value", dsplOps.maxChainAngle);
	$( "#chainAngleValue" ).html( dsplOps.maxChainAngle.toPrecision(2) +'&deg;');
    // event handler for max allowe dchain angle
    $( "#chainLineSlider" ).on( "slide", function( event, ui ) {
    	//console.log($("#slider").slider("value"));
    	dsplOps.maxChainAngle = $("#chainLineSlider").slider("value");
    	$( "#chainAngleValue" ).html( dsplOps.maxChainAngle.toPrecision(2) +'&deg;' );
    	gearSet = new GearSet(aChainrings, aSprockets, circumference, hubType );
    	if(c2visible && canvas2.getContext){					
    		gearSet2 = new GearSet(aChainrings2, aSprockets2, circumference2, hubType2);
    		drawBothGraphics(canvas, canvas2, gearSet, gearSet2, cadence, dsplOps);
    	} else {
			drawGraphics(canvas, gearSet, gearSet.Ratios[0][gearSet.Cogs.length-1]*gearSet.HubGears[0], 
				         gearSet.Ratios[gearSet.Chainrings.length-1][0]*gearSet.HubGears[gearSet.HubGears.length-1],  
				         cadence, dsplOps);			 
    	}			 
		$("#inputURL").val( createURL(gearSet, gearSet2, cadence, dsplOps));
    });

});





