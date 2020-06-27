/*
Copyright 2016-2019 Seeing-Theory

Modifications Copyright (C) 2020 sheronw1174@gmail.com

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

$(window).load(function () {
  pre_inc();
  relationship();
  cfr();
});

//*******************************************************************************//
// Prevalence and Incidence
//*******************************************************************************//
function pre_inc() {
  //Adapted from: https://bl.ocks.org/mbostock/5249328
  //              http://bl.ocks.org/mbostock/7833311

  var widthRV = 500,
    heightRV = 400;

  var radiusRV = 20,
    borderRV = 1;

  var hexbin = d3.hexbin().size([widthRV, heightRV]).radius(radiusRV);

  var svgHex = d3
    .select("#svgHex")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 " + widthRV + " " + heightRV)
    .attr("preserveAspectRatio", "xMidYMid meet");

  svgHex.append("path").attr("class", "mesh").attr("d", hexbin.mesh());

  var hexagon = svgHex
    .append("g")
    .attr("class", "hexagon")
    .selectAll("path")
    .data(hexbin(hexbin.centers()))
    .enter()
    .append("path")
    .attr("d", hexbin.hexagon(radiusRV - borderRV / 2))
    .attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    })
    .style("stroke", "white")
    .attr("id", function (d) {
      d.state = -1;
      d.fill = 0;
      return "bin-" + d.i + "-" + d.j;
    })
    .on("mousedown", mousedown)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup);

  // d.state: 1 - incidence, 0 - prevalence, -1: healthy (not fill)

  var mousing = 0;

  function mousedown(d) {
    mousing = d.fill ? -1 : +1; //-1 clear or +1 add
    mousemove.apply(this, arguments);
  }

  var recovered = 0;
  function mousemove(d) {
    if (mousing && d.state != 0) {
      d.fill = mousing > 0; // to add or not add
      // others: become stays healthy or become incident
      d3.select(this).style("fill", d.fill ? "#c7c7c7" : "white");
      d.state = d.fill ? 1 : -1;
    }
  }

  function mouseup() {
    mousemove.apply(this, arguments);
    mousing = 0;
  }

  // add one row in color
  function addRow(prevalence, incidence) {
    $("#pre_inc").append(
      "<tr class='prob_map'>\
      <td>" +
        prevalence.toFixed(3) +
        "</td>\
      <td>" +
        incidence.toFixed(3) +
        "</td>\
      </tr>"
    );
  }

  // handle submit event
  $("#startHex").on("click", function () {
    const total = hexagon[0].length;
    var old_cases = 0;
    var new_cases = 0;
    hexagon.each(function (d) {
      if (d.state == 0) old_cases++;
      if (d.state == 1) {
        new_cases++;
        d.state = 0;
        d3.select(this).style("fill", "red");
      }
    });
    addRow((old_cases + new_cases) / total, new_cases / old_cases);
  });

  // handle reset event
  $("#resetHex").on("click", function () {
    $("#pre_inc td").each(function () {
      $(this).remove();
    });
    $("#pre_inc").append(
      "<tr><td>Prevalence</td><td>Incidence</td></tr><tr><td>0</td><td>0</td></tr>"
    );
    hexagon.each(function (d) {
      if (d.fill) {
        d.state = -1;
        d.fill = 0;
        d3.select(this)
          .style("fill", "white")
          .style("stroke", "white")
          .style("stroke-width", borderRV);
      }
    });
  });
}

//*******************************************************************************//
//Relationship Among Duration, Prevalence and Incidence Rate
//*******************************************************************************//
function relationship() {
  var radius = 5;
  var margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
  var widthR = radius * 20;
  var heightR = radius * 20;

  var svgPool = d3
    .select("#svgPool")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr(
      "viewBox",
      "0 0 " +
        (widthR + margin.left + margin.right) +
        " " +
        (heightR + margin.top + margin.bottom)
    )
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var dotsdata = new Array(100).fill(0).map((d, i) => i);

  var dots = svgPool
    .selectAll("circle")
    .data(dotsdata)
    .enter()
    .append("circle")
    .attr("r", radius - 1)
    .attr("cy", (d) => Math.floor(d / 10) * radius * 2 + radius)
    .attr("cx", (d) => (d % 10) * radius * 2 + radius)
    .style("fill", "#BDC0BA");

  // scales
  var x = d3.scale.linear().domain([0, 1]).range([0, widthR]);
  var y = d3.scale.linear().domain([0, 1]).range([0, heightR]);

  function slideBars() {
    // parameters
    var labels = ["Incidence Rate(cases/day)", "Duration(days)"],
      probs = [5, 5];

    generate_pool(0, probs[0] * probs[1]);

    // set up dimensions of SVG
    var margin = {
        top: 10,
        right: 10,
        bottom: 20,
        left: 10,
      },
      width = 300 - margin.left - margin.right,
      height = 150 - margin.top - margin.bottom;

    // create SVG
    var svg = d3
      .select("#inc_dur")
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr(
        "viewBox",
        "0 0 " +
          (width + margin.left + margin.right) +
          " " +
          (height + margin.top + margin.bottom)
      )
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // scales
    var x = d3.scale.ordinal().domain([0, 1]).rangeRoundBands([0, width], 0.5);
    var y = d3.scale.linear().domain([0, 10]).range([height, 0]);

    // axes
    var xAxis = d3.svg
      .axis()
      .scale(x)
      .orient("bottom")
      .tickFormat(function (d) {
        return labels[d];
      });

    // graph
    svg
      .append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    var prev = probs[0] * probs[1];
    // drag
    var drag = d3.behavior
      .drag()
      .origin(function () {
        return { x: 0, y: d3.select(this).attr("y") };
      })
      .on("drag", function (d, i) {
        var val = Math.max(0, Math.min(y.invert(d3.event.y), 10));
        tip.show(val, this);
        probs[i] = val;
        update(probs, 0);
      })
      .on("dragend", function (d, i) {
        generate_pool(prev, probs[0] * probs[1]);
        prev = probs[0] * probs[1];
      });

    // tool tip

    var tip = d3
      .tip()
      .attr("class", "d3-tip")
      .offset([-10, 0])
      .html(function (d, i) {
        return round(d, 0);
      });

    // draw bars
    function update(data, time) {
      // JOIN new data with old elements.
      var rects = svg.selectAll("rect").data(data);

      // ENTER new elements present in new data.
      rects
        .enter()
        .append("rect")
        .attr("x", function (d, i) {
          return x(i);
        })
        .attr("width", x.rangeBand())
        .attr("class", function (d, i) {
          return !i ? "inc" : "dur";
        })
        .style("cursor", "row-resize")
        .on("mouseover", function (d) {
          tip.show(d, this);
        })
        .on("mouseout", tip.hide)
        .on("mouseup", tip.hide)
        .call(drag);

      // UPDATE old elements present in new data.
      rects
        .transition()
        .duration(time)
        .attr("y", function (d, i) {
          return y(d);
        })
        .attr("height", function (d, i) {
          return y(10 - d);
        });

      // EXIT old elements not present in new data.
      rects.exit().remove();

      // Pull axis up
      svg.select(".axis").moveToFront();
    }

    function generate_pool(prev, now) {
      if (prev < now) {
        // add new dots
        dots.each(function (d, i) {
          if (i >= prev && i < now) {
            var circle = svgPool
              .append("circle")
              .attr("r", radius - 1)
              .style("fill", "#81C7D4")
              .attr("cx", d3.select(this).attr("cx"))
              .attr("cy", 0);

            circle
              .transition()
              .duration(800)
              .ease("bounce")
              .attr("cy", d3.select(this).attr("cy"))
              .each("end", function () {
                setTimeout(() => {
                  d3.select(this)
                    .attr("opacity", 1)
                    .transition()
                    .duration(800)
                    .attr("opacity", 0)
                    .remove();
                  dots
                    .filter((d, index) => index == i)
                    .each(function (d, i) {
                      d3.select(this).style("fill", "#E87A90");
                    });
                }, 500);
              });
          }
        });
      }
      if (prev > now) {
        // remove existed dots
        dots.each(function (d, i) {
          if (i >= now && i < prev) {
            d3.select(this).style("fill", "#BDC0BA");
            var circle = svgPool
              .append("circle")
              .attr("r", radius - 1)
              .style("fill", "#81C7D4")
              .attr("cx", d3.select(this).attr("cx"))
              .attr("cy", d3.select(this).attr("cy"));

            circle
              .transition()
              .duration(800)
              .ease("bounce")
              .attr("cy", height)
              .each("end", function () {
                d3.select(this)
                  .attr("opacity", 1)
                  .transition()
                  .duration(800)
                  .attr("opacity", 0)
                  .remove();
              });
          }
          if (i >= prev) {
            d3.select(this).style("fill", "#BDC0BA");
          }
        });
      }
    }

    // setup
    update(probs, 0);
    svg.call(tip);
  }

  slideBars();
}

//*******************************************************************************//
//CFR
//*******************************************************************************//
function cfr() {
  var width = 5 * 2 * 10;
  var height = 5 * 2 * 10;

  var svgPeople = d3
    .select("#svgPeople")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr("preserveAspectRatio", "xMidYMid meet");

  var dotsdata = new Array(50).fill(0).map((d, i) => {
    return {
      num: i,
      color: "black",
    };
  });

  var dots = svgPeople.selectAll("g.node").data(dotsdata).enter().append("g");

  dots
    .append("use")
    .attr("xlink:href", "#person")
    .attr("y", (d) => Math.floor(d.num / 10) * 15 + 15)
    .attr("x", (d) => (d.num % 10) * 5 * 2 + 5)
    .style("fill", (d) => d.color)
    .on("click", handleClick)
    .on("mouseover", function (d) {
      // if not red (death) then clickable
      if (d.color != "#E83015") d3.select(this).style("fill", "#BDC0BA");
    })
    .on("mouseout", function (d) {
      d3.select(this).style("fill", d.color);
    });

  function handleClick(d) {
    if (d.color != "#E83015")
      d.color = d.color == "black" ? "#B5495B" : "#E83015";
    d3.select(this).style("fill", d.color);
    const detected = dotsdata.reduce(
      (a, c) => (a += c.color != "black" ? 1 : 0),
      0
    );
    const fatal = dotsdata.reduce(
      (a, c) => (a += c.color == "#E83015" ? 1 : 0),
      0
    );
    const cfr = fatal / detected;
    console.table({ detected, fatal, cfr });
    $("#detected").html("Current Detected Cases: " + detected);
    $("#fatal").html("Current Fatal Cases: " + fatal);
    $("#cfr").html("Current CFR: " + cfr);
  }
}
