function toNum(val) {
  if (val === null || val === undefined) return null;
  const cleaned = val.toString().replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

// (Regression helper unused but i kept it for structural consistency)
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
    const projSerious = [];
    const rollingSerious = [];   // "Serious Injuries (5-Year Rolling Average)"
    const trendSerious = [];     // "Trendline for Serious Injuries (5 - Year Rolling Average)"
    const seriousTargets = [];   // "Serious Injuries Target"

    // Arrays for labels + leader lines for Serious Injuries Target
    const labelX = [];
    const labelY = [];
    const labelText = [];
    const shapes = [];

    // Bigger offset so lines are visible with 400–500 range
    const labelOffset = 25; // pixels in data units

    rows.forEach((row) => {
      const year = parseInt(row["Year"], 10);
      if (Number.isNaN(year)) return;

      // Keep 2022–2044 inclusive
      if (year < 2022 || year > 2044) return;

      const proj = toNum(row["Projected Total Serious Injuries"]);
      const roll = toNum(row["Serious Injuries (5-Year Rolling Average)"]);
      const trend = toNum(row["Trendline for Serious Injuries (5 - Year Rolling Average)"]);
      const tgt = toNum(row["Serious Injuries Target"]);

      years.push(year);
      projSerious.push(proj);
      rollingSerious.push(roll);
      trendSerious.push(trend);
      seriousTargets.push(tgt);

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
            width: 1.3,
            dash: "dot",
          },
        });
      }
    });

    // === Traces ===

    // Bars: Projected Total Serious Injuries
    const barProjected = {
      x: years,
      y: projSerious,
      type: "bar",
      name: "Projected Total Serious Injuries",
      marker: {
        color: "rgba(242, 107, 56, 0.65)",
      },
      hovertemplate: "Projected Serious Injuries: %{y:.1f}<extra></extra>",
    };

    // Blue line: Serious Injuries (5-Year Rolling Average)
    const lineRolling = {
      x: years,
      y: rollingSerious,
      type: "scatter",
      mode: "lines",
      name: "Serious Injuries (5-Year Rolling Average)",
      line: { width: 3, color: "rgb(0, 115, 170)" },
      hovertemplate: "5-yr Rolling Avg: %{y:.1f}<extra></extra>",
    };

    // Red line: Trendline for Serious Injuries (5-Year Rolling Average) from CSV
    const lineTrend = {
      x: years,
      y: trendSerious,
      type: "scatter",
      mode: "lines",
      name: "Trendline for Serious Injuries (5-Year Rolling Average)",
      line: { width: 3, color: "rgb(77, 77, 79)" },
      hovertemplate: "Trendline: %{y:.1f}<extra></extra>",
    };

    // Serious Injuries Target: POINTS ONLY (no connecting line)
    const targetMarkers = {
      x: years,
      y: seriousTargets,
      type: "scatter",
      mode: "markers",
      name: "Serious Injuries Target",
      marker: {
        size: 9,
        color: "rgb(0, 80, 90)",
        symbol: "circle",
      },
      hovertemplate: "Serious Injuries Target: %{y:.1f}<extra></extra>",
    };

    // Labels above the Serious Injuries Target markers
    const targetLabels = {
      x: labelX,
      y: labelY,
      type: "scatter",
      mode: "text",
      name: "Serious Injuries Target Labels",
      text: labelText,
      textposition: "top center",
      textfont: {
        size: 12,
        color: "rgb(0, 80, 90)",
        family: "Segoe UI Semibold, Segoe UI, Arial, sans-serif",
      },
      hoverinfo: "skip",
      showlegend: false,
    };

    // Layout
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
        title: "Number of Serious Injuries",
        rangemode: "tozero",
        showgrid: true,
      },
      bargap: 0.15,
      hovermode: "x unified",
      legend: {
        orientation: "h",
        x: 0,
        y: -0.2,
      },
      margin: { l: 70, r: 40, t: 40, b: 70 },

      // 👇 this is what actually draws the leader lines
      shapes: shapes,
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToKeep: ["toImage"],
      toImageButtonOptions: {
        format: "png",
        filename: "policy-target-setting-serious-injuries",
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
