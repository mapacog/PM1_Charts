function toNum(val) {
  if (val === null || val === undefined) return null;
  const cleaned = val.toString().replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

// (Regression helper now unused but i kept it for structure consistency)
function linearRegression(xs, ys) {
  const n = xs.length;
  if (n === 0) return { m: 0, b: 0 };

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = xs[i];
    const y = ys[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { m: 0, b: sumY / n };

  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;
  return { m, b };
}

d3.csv("PM1_PolicyTargetSetting.csv")
  .then(function (rows) {
    const years = [];
    const projFatal = [];
    const rollingFatal = [];   // "Fatalities (5-Year Rolling Average)"
    const trendFatal = [];     // "Trendline for Fatalities (5 - Year Rolling Average)" from our PM1 CSV
    const fatalTargets = [];   // "Fatalities Target"

    // Arrays for labels + leader lines for Fatalities Target
    const labelX = [];
    const labelY = [];
    const labelText = [];
    const shapes = [];
    const labelOffset = 4; 

    rows.forEach((row) => {
      const year = parseInt(row["Year"], 10);
      if (Number.isNaN(year)) return;

      // Keeping 2022–2044 inclusive
      if (year < 2022 || year > 2044) return;

      const proj = toNum(row["Projected Total Fatalities"]);
      const roll = toNum(row["Fatalities (5-Year Rolling Average)"]);
      const trend = toNum(row["Trendline for Fatalities (5-Year Rolling Average)"]) 
      const tgt  = toNum(row["Fatalities Target"]);

      years.push(year);
      projFatal.push(proj);
      rollingFatal.push(roll);
      trendFatal.push(trend);
      fatalTargets.push(tgt);

      if (tgt != null) {
        const yLabel = tgt + labelOffset;

        labelX.push(year);
        labelY.push(yLabel);
        labelText.push(tgt.toFixed(1));

        // dotted leader line from point to label
        shapes.push({
          type: "line",
          x0: year,
          x1: year,
          y0: tgt,
          y1: yLabel,
          line: {
            color: "rgb(0, 80, 90)",
            width: 1,
            dash: "dot",
          },
        });
      }
    });

    // === Traces ===

    // Bars: Projected Total Fatalities
    const barProjected = {
      x: years,
      y: projFatal,
      type: "bar",
      name: "Projected Total Fatalities",
      marker: {
        color: "rgba(84, 180, 216, 0.8)",
      },
      hovertemplate: "Projected Fatalities: %{y:.1f}<extra></extra>",
    };

    // Line: Fatalities (5-Year Rolling Average) from CSV
    const lineRolling = {
      x: years,
      y: rollingFatal,
      type: "scatter",
      mode: "lines",
      name: "Fatalities (5-Year Rolling Average)",
      line: { width: 3, color: "rgb(0, 115, 170)" },
      hovertemplate: "5-yr Rolling Avg: %{y:.1f}<extra></extra>",
    };

    // RED Line: Trendline for Fatalities (5-Year Rolling Average) from CSV column
    const lineTrend = {
      x: years,
      y: trendFatal,
      type: "scatter",
      mode: "lines",
      name: "Trendline for Fatalities (5-Year Rolling Average)",
      line: { width: 3, color: "rgb(250, 128, 114)" },
      hovertemplate: "Trendline: %{y:.1f}<extra></extra>",
    };

    // Fatalities Target: POINTS ONLY (no connecting line)
    const targetMarkers = {
      x: years,
      y: fatalTargets,
      type: "scatter",
      mode: "markers",
      name: "Fatalities Target",
      marker: {
        size: 9,
        color: "rgb(0, 80, 90)",
        symbol: "circle",
      },
      hovertemplate: "Fatalities Target: %{y:.1f}<extra></extra>",
    };

    // Labels above the Fatalities Target markers
    const targetLabels = {
      x: labelX,
      y: labelY,
      type: "scatter",
      mode: "text",
      name: "Fatalities Target Labels",
      text: labelText,
      textposition: "top center",
      textfont: {
        size: 11,
        color: "rgb(0, 80, 90)",
        family: "Segoe UI Semibold, Segoe UI, Arial, sans-serif",
      },
      hoverinfo: "skip",
      showlegend: false,
    };

    const layout = {
      title: "",
      xaxis: {
        title: "",
        tickmode: "linear",
        dtick: 1,
        showgrid: false,
        zeroline: false,
        tickangle: -45,
        automargin: true,
      },
      yaxis: {
        title: "Number of Fatalities",
        rangemode: "tozero",
        showgrid: true,
      },
      bargap: 0.12,
      hovermode: "x unified",
      legend: {
        orientation: "h",
        x: 0,
        y: -0.2,
      },
      margin: { l: 70, r: 40, t: 40, b: 70 },
      shapes: shapes, // dotted leader lines
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToKeep: ["toImage"],
      toImageButtonOptions: {
        format: "png",
        filename: "policy-target-setting-fatalities",
        width: 1200,
        height: 600,
        scale: 1,
      },
    };

    Plotly.newPlot(
      "chart",
      [barProjected, lineRolling, lineTrend, targetMarkers, targetLabels],
      layout,
      config
    );
  })
  .catch(function (error) {
    console.error("Error loading CSV:", error);
  });
