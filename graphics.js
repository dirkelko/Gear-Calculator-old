// xLog - returns x position of value v between vMin and vMax
// in logarithmic scale with width xSize
function xLog(vMin, vMax, xSize, v) {
	if (v >= vMin && v <= vMax) {
		if (vMin > 0) {
			return Math.log(v / vMin) / Math.log(vMax / vMin) * xSize;
		} else {
			return Math.log(v) / Math.log(vMax) * xSize;
		}
	} else {
		return 0;
	}
}


// drawGraphics draws the actual graphics for the given gearSet
//
function drawGraphics(canvas, gearSet, minDev, maxDev, cadence, dsplOps) {
	//var nChainrings = 2;
	var gWidth = canvas.width -1 ;
	var gHeight = canvas.height - 1;
	var gX = 0.5;//10.5;
	var gY = 0.5;//10.5;
	var ctx = canvas.getContext('2d');

	// calculate the min and max values of the development scale ( 80%-115% of actual values);
	var maxDev = maxDev * 1.15;
	var minDev = minDev * 0.80;

	// Draw Rectangle
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(gX, gY, gWidth, gHeight);

	ctx.fillStyle = "#000000";
	ctx.font = "12px sans-serif";
	ctx.textAlign = "center";

	ctx.strokeStyle = "#000000";
	ctx.lineWidth = 1;
	ctx.strokeRect(gX, gY, gWidth, gHeight);

	// draw scale ticks for development (logarithmic scales) for SI oe US units
	ctx.beginPath();

	if (dsplOps.siUnits) {
		// draw scale for Development/m
		var iMinDev = Math.floor(minDev * 10);
		var iMaxDev = Math.floor(maxDev * 10 + 1);
		ctx.textAlign = "left";
		ctx.fillText("%development".toLocaleString()+"/m", 10, 21);
		ctx.textAlign = "center";
		for (var i = iMinDev; i <= iMaxDev; i++) {
			var x = gX + Math.round(xLog(minDev, maxDev, gWidth, i / 10));
			if (x > gX) {
				ctx.moveTo(x, gY);
				//ctx.lineTo(x, gY+5);
				if (i % 10 === 0) {
					ctx.lineTo(x, gY + 10);
					if (x > 80) {
						ctx.fillText(i / 10, x, gY + 20);
					}
				} else if (i % 5 === 0) {
					ctx.lineTo(x, gY + 8);
				} else {
					ctx.lineTo(x, gY + 5);
				}
			}
		}
	} else {
		// draw scale for Gear Inches
		var minGearInches = minDev * 100 / 2.54  / Math.PI;
		var maxGearInches = maxDev * 100 / 2.54  / Math.PI;
		var iMinGearInches = Math.floor(minGearInches);
		var iMaxGearInches = Math.floor(maxGearInches + 1);
		ctx.textAlign = "left";
		ctx.fillText("Gear Inches", 10, 21);
		ctx.textAlign = "center";

		for (i = iMinGearInches; i <= iMaxGearInches; i++) {
			x = gX + Math.round(xLog(minGearInches, maxGearInches, gWidth, i));
			if (x > gX) {
				ctx.moveTo(x, gY);
				if (i % 10 === 0) {
					ctx.lineTo(x, gY + 10);
					if (x > 80) {
						ctx.fillText(i, x, gY + 20);
					}
				} else if (i % 5 === 0) {
					ctx.lineTo(x, gY + 8);
				} else {
					ctx.lineTo(x, gY + 5);
				}
			}

		}
	}
	ctx.stroke();
	ctx.closePath();

	// draw scale ticks for speed (logarithmic scales)
	var unitFactor = (dsplOps.siUnits) ? 60 / 1000 : 60 / 1609.3;
	// km/h or mph
	var minSpeed = minDev * cadence * unitFactor;
	var maxSpeed = maxDev * cadence * unitFactor;
	var iMinSpeed = Math.round(minSpeed + 0.5);
	var iMaxSpeed = Math.round(maxSpeed - 0.5);
	ctx.textAlign = "left";
	ctx.fillText((dsplOps.siUnits)? "km/h" : "mph", 10, gHeight - 30 + 20);
	ctx.textAlign = "center";
	ctx.beginPath();
	ctx.moveTo(gX, gY + gHeight - 30);
	ctx.lineTo(gX + gWidth, gY + gHeight - 30);
	for ( i = iMinSpeed; i <= iMaxSpeed; i++) {
		x = gX + Math.round(xLog(minSpeed, maxSpeed, gWidth, i));
		if (x > gX) {
			ctx.moveTo(x, gY + gHeight - 30);
			if (i % 5 === 0) {
				ctx.lineTo(x, gY + gHeight - 30 + 10);
				if (x > 40) {
					ctx.fillText(i, x, gY + gHeight - 30 + 20);
				}
			} else {
				ctx.lineTo(x, gY + gHeight - 30 + 5);
			}
		}
	}
	ctx.stroke();
	ctx.closePath();

	// Draw red Chainring lines and circles with #teeth
	for ( i = 0; i < gearSet.Chainrings.length; i++) {
		var y = Math.round(gHeight / (gearSet.Chainrings.length + 1) * (i + 1)) + gY -10;
		ctx.strokeStyle = "#e34c26";
		//ctx.strokeStyle = "#DD0000";
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.moveTo(gX, y);
		ctx.lineTo(gX + gWidth, y);
		ctx.stroke();
		ctx.closePath();
		//draw a circle
		ctx.beginPath();
		ctx.fillStyle = "#e34c26";
		//ctx.fillStyle = "#DD0000";
		ctx.arc(gX + gWidth - 20 , y, 10, 0, Math.PI*2, true);
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "bold 12px sans-serif";
		ctx.fillText(gearSet.Chainrings[i].toString(), gX + gWidth -20, y + 4 );
	}

	// Draw triangles for each Chainring Sprocket combination
	var ratios = new Array();
	ctx.fillStyle = "#000000";
	ctx.font = "bold 11px sans-serif";
	var tSize = 12;
	for ( i = 0; i < gearSet.Chainrings.length; i++) {
		y = Math.round(gHeight / (gearSet.Chainrings.length + 1) * (i + 1)) + gY -10.5;
		for ( var j = 0; j < gearSet.Cogs.length; j++) {
			if (gearSet.Chainrings[i] * gearSet.Cogs[j] !== 0) {
				x = gX + Math.round(xLog(minDev, maxDev, gWidth, gearSet.Chainrings[i] / gearSet.Cogs[j] * gearSet.circumference / 1000));
				//var diff_ratio_down = (gearSet.Chainrings[i] / gearSet.Cogs[j-1]) - (gearSet.Chainrings[i] / gearSet.Cogs[j]);
				//var diff_ratio_up = (gearSet.Chainrings[i] / gearSet.Cogs[j]) - (gearSet.Chainrings[i] / gearSet.Cogs[j+1]);
				var k = 0;
				var x_d;
				var y_d;
				var shiftStyle = ["#000000", "#00ff00", "#ffff00", "#ff7f00", "#ff0000", "#0000ff", "#9400d3"];
				while (k < parseInt($("#cross_sValue").html())+1) {
					//var draw_shift_path = false;
					//var diffratio_3 = (gearSet.Chainrings[i+1] / gearSet.Cogs[j+k]) - (gearSet.Chainrings[i] / gearSet.Cogs[j]);
					//var diffratio_4 = (gearSet.Chainrings[i+1] / gearSet.Cogs[j+k]) - (gearSet.Chainrings[i] / gearSet.Cogs[j]);
					var cur_rat = gearSet.Chainrings[i] / gearSet.Cogs[j];
					var prop_rat = gearSet.Chainrings[i+1] / gearSet.Cogs[j+k];
					var diff_rat = Math.abs(cur_rat - prop_rat);
					var min_rat = Math.min(cur_rat, prop_rat);
					if (diff_rat / min_rat < parseFloat($("#cross_maxValue").html())/100 && diff_rat / min_rat > parseFloat($("#cross_minValue").html())/100) {
						y_d = Math.round(gHeight / (gearSet.Chainrings.length + 1) * (i + 2)) + gY -10.5;
						x_d = gX + Math.round(xLog(minDev, maxDev, gWidth, gearSet.Chainrings[i+1] / gearSet.Cogs[j+k] * gearSet.circumference / 1000));
						ctx.strokeStyle = shiftStyle[k];
						ctx.lineWidth = 1;
						ctx.beginPath();
						ctx.moveTo(x, y);
						ctx.lineTo(x_d, y_d);
						ctx.stroke();
						ctx.closePath();
					}
					/*else if (Math.abs(diffratio_3) < diff_ratio_down && diffratio_3 < 0 &&  ((gearSet.Chainrings[i] / gearSet.Cogs[j+1]) / (gearSet.Chainrings[i+1] / gearSet.Cogs[j+k])) < 0.965) {
						y_d = Math.round(gHeight / (gearSet.Chainrings.length + 1) * (i + 2)) + gY -10.5;
						x_d = gX + Math.round(xLog(minDev, maxDev, gWidth, gearSet.Chainrings[i+1] / gearSet.Cogs[j+k] * gearSet.circumference / 1000));
						draw_shift_path = true;
					}*/

					k++;
				}
			}

			if (x > gX + 12) {
					ctx.beginPath();
					//draw triangle for gear
					ctx.moveTo(x - tSize, y - tSize);
					ctx.lineTo(x + tSize, y - tSize);
					ctx.lineTo(x, y + tSize);
					ctx.lineTo(x - tSize, y - tSize);
					// fill triangle either black or grey dep. of chain angle
					ctx.fillStyle = (gearSet.ChainAngle[i][j] > dsplOps.maxChainAngle || gearSet.isGearHub)? "#E8E8E8" : "#000000" ;
					ctx.fill();
					ctx.closePath();
					// write # sprocket teeth onto triangle
					ctx.fillStyle = "rgb(200,200,200)";
					ctx.fillText(gearSet.Cogs[j], x, y - 1);
					ctx.fillStyle = "rgb(00,00,00)";
					if (!gearSet.isGearHub){
						switch(dsplOps.values) {
							case "ratio":
								ctx.fillText((gearSet.Chainrings[i]/gearSet.Cogs[j]).toPrecision(3), x, y - 16);
								if (j>0) {
									ctx.fillText((gearSet.Chainrings[i]/gearSet.Cogs[j-1] - gearSet.Chainrings[i]/gearSet.Cogs[j]).toPrecision(2), x + 22, y + 16);
								}
								break;
							case "development":
								ctx.fillText((gearSet.Chainrings[i]/gearSet.Cogs[j]*gearSet.circumference/1000).toPrecision(3), x, y - 16);
								break;
							case "gear_inches":
								ctx.fillText((gearSet.Chainrings[i]/gearSet.Cogs[j]*gearSet.circumference/25.4/3.1415927).toPrecision(3), x, y - 16);
								break;
							case "speed":
								ctx.fillText((gearSet.Chainrings[i]/gearSet.Cogs[j]*gearSet.circumference/1000* cadence * unitFactor).toPrecision(3), x, y - 16);
								break;
							case "speed-c":
								ctx.fillText((gearSet.Chainrings[i]/gearSet.Cogs[j]*gearSet.circumference/1000* (cadence-parseInt($("#cadencedValue").html())) * unitFactor).toPrecision(3), x-15, y + 16);
								ctx.fillText((gearSet.Chainrings[i]/gearSet.Cogs[j]*gearSet.circumference/1000* (cadence+parseInt($("#cadencedValue").html())) * unitFactor).toPrecision(3), x+15, y - 16);
								break;
							default:
						}
					}

					// draw additional triangles for gear hubs
					if (gearSet.isGearHub) {
					    if ( gearSet.Chainrings[i]/gearSet.Cogs[j] < gearSet.hubType.minRatio ){
					        ctx.textAlign = "left";
                            ctx.fillStyle = "#e34c26";
					        ctx.fillText("%torque_warning".toLocaleString(), 10, 80);
					        ctx.textAlign = "center";
					    }
						for ( var k = 0; k < gearSet.HubGears.length; k++) {
							var xgh = gX + Math.round(xLog(minDev, maxDev, gWidth, gearSet.Chainrings[i] / gearSet.Cogs[j]
							    * gearSet.HubGears[k]*gearSet.circumference / 1000));
							ctx.beginPath();
							//draw triangle for gear
							ctx.moveTo(xgh - tSize, y - tSize);
							ctx.lineTo(xgh + tSize, y - tSize);
							ctx.lineTo(xgh, y + tSize);
							ctx.lineTo(xgh - tSize, y - tSize);
							// fill triangle either black or grey dep. of chain angle
							ctx.fillStyle = "#000000";
							ctx.fill();
							ctx.closePath();
                            switch(dsplOps.values) {
                                case "ratio":
					                ctx.fillText((gearSet.Chainrings[i]/gearSet.Cogs[j]*gearSet.HubGears[k]).toPrecision(3), xgh, y - 16);
                                    break;
                                case "development":
					                ctx.fillText((gearSet.Chainrings[i]/gearSet.Cogs[j]*gearSet.HubGears[k]*gearSet.circumference/1000).toPrecision(3), xgh, y - 16);
                                    break;
                            case "gear_inches":
    					        ctx.fillText((gearSet.Chainrings[i]/gearSet.Cogs[j]*gearSet.HubGears[k]*gearSet.circumference/25.4/3.1415927).toPrecision(3), xgh, y - 16);
                                break;
                                case "speed":
					                ctx.fillText((gearSet.Chainrings[i]/gearSet.Cogs[j]*gearSet.HubGears[k]*gearSet.circumference/1000* cadence * unitFactor).toPrecision(3), xgh, y - 16);
                                    break;
                                default:
                            }
						}
						ctx.fillStyle = "rgb(200,200,200)";
						ctx.fillText(gearSet.Cogs[j], x, y - 1);
					}

				}
			if (gearSet.ChainAngle[i][j] < dsplOps.maxChainAngle){
					if (gearSet.isGearHub){
						for ( k = 0; k < gearSet.HubGears.length; k++) {
							ratios.push(gearSet.Ratios[i][j]*gearSet.HubGears[k]);
						}
					} else {
						ratios.push(gearSet.Ratios[i][j]);
					}
				}
		}
	}


	// draw rectangle with ticks for each possible gear and display gear steps
	ratios.sort(function(a,b){return a-b;});
	ctx.beginPath();
	ctx.fillStyle = "rgb(150,150,150)";
	ctx.textAlign = "left";
	if (gearSet.hubType.id !== "DERS"){
	    ctx.fillText( gearSet.hubType.name, 10, 181);
	}
	ctx.fillText( "%wheel_size".toLocaleString() + " " + tireTypes.getNameByCircumference(gearSet.circumference), 10, 161);
	ctx.fillRect(gX, gHeight -50, gWidth, 16);
	ctx.fillStyle = "#FFFFFF";
	ctx.strokeStyle = "#FFFFFF";
	ctx.fillText( "%gear_step".toLocaleString(), 10, gHeight - 38);
	ctx.fillText( Math.round(ratios[ratios.length -1 ]/ratios[0] * 100) +"%", gX + gWidth - 50, gHeight - 38);
	ctx.textAlign = "center";
	for ( i = 0; i < ratios.length; i++){
		x = gX + Math.round(xLog(minDev, maxDev, gWidth, ratios[i] * gearSet.circumference / 1000));
		ctx.moveTo(x, gHeight - 50);
		ctx.lineTo(x, gHeight - 35);
		if (i > 0){
			var gearStep = Math.round(ratios[i] / ratios[i - 1] * 100 - 100);
			if (gearStep > 1 ){
				var x0 = gX + Math.round(xLog(minDev, maxDev, gWidth, ratios[i-1] * gearSet.circumference / 1000));
		    	ctx.fillText(gearStep, (x + x0)/2, gHeight - 38);
			}
		}
	}
	ctx.stroke();
	ctx.closePath();


}
