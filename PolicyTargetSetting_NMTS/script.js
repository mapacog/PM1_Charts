// === Helper: safe numeric conversion ===
function toNum(val) {
  if (val === null || val === undefined) return null;
  const cleaned = val.toString().replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

// (Regression helper now unused but kept for structure consistency)
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

// === Load CSV and build NMT Policy Target Setting chart ===
d3.csv("PM1_PolicyTargetSetting.csv")
  .then(function (rows) {
    const years = [];
    const projNMT = [];    // "Projected Total NMT FSI"
    const rollingNMT = []; // "NMT FSI (5-Year Rolling Average)"
    const trendNMT = [];   // "Trendline for Non-Motorist Fatal and Serious Injuries (5 - Year Rolling Average)"
    const nmtTargets = []; // "NMT FSI Targets"

    // Arrays for labels + leader lines for NMT FSI Targets
    const labelX = [];
    const labelY = [];
    const labelText = [];
    const shapes = [];
    const labelOffset = 6; // vertical gap between marker and label

    rows.forEach((row) => {
      const year = parseInt(row["Year"], 10);
      if (Number.isNaN(year)) return;

      // Keep 2022–2044 inclusive
      if (year < 2022 || year > 2044) return;

      const proj  = toNum(row["Projected Total NMT FSI"]);
      const roll  = toNum(row["NMT FSI (5-Year Rolling Average)"]);
      const trend = toNum(
        row["Trendline for Non-Motorist Fatal and Serious Injuries (5 - Year Rolling Average)"]
      );
      const tgt   = toNum(row["NMT FSI Targets"]);

      years.push(year);
      projNMT.push(proj);
      rollingNMT.push(roll);
      trendNMT.push(trend);
      nmtTargets.push(tgt);

      // Target labels + dotted leader lines
      if (tgt != null) {
        const yLabel = tgt + labelOffset;

        labelX.push(year);
        labelY.push(yLabel);
        labelText.push(tgt.toFixed(1));

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

    // Bars: Projected Total NMT FSI
    const barProjected = {
      x: years,
      y: projNMT,
      type: "bar",
      name: "Projected Total NMT FSI",
      marker: {
        color: "rgba(126, 200, 160, 0.75)",
      },
      hovertemplate: "Projected NMT FSI: %{y:.1f}<extra></extra>",
    };

    // Line: NMT FSI (5-Year Rolling Average) from CSV
    const lineRolling = {
      x: years,
      y: rollingNMT,
      type: "scatter",
      mode: "lines",
      name: "NMT FSI (5-Year Rolling Average)",
      line: { width: 3, color: "rgb(0, 115, 170)" },
      hovertemplate: "5-yr Rolling Avg: %{y:.1f}<extra></extra>",
    };

    // RED trendline: directly from CSV Trendline column
    const lineTrend = {
      x: years,
      y: trendNMT,
      type: "scatter",
      mode: "lines",
      name: "Trendline for NMT FSI (5-Year Rolling Average)",
      line: { width: 3, color: "rgb(250, 128, 114)" },
      hovertemplate: "Trendline: %{y:.1f}<extra></extra>",
    };

    // NMT FSI Targets: POINTS ONLY (no line)
    const targetMarkers = {
      x: years,
      y: nmtTargets,
      type: "scatter",
      mode: "markers",
      name: "NMT FSI Targets",
      marker: {
        size: 9,
        color: "rgb(0, 80, 90)",
        symbol: "circle",
      },
      hovertemplate: "NMT FSI Target: %{y:.1f}<extra></extra>",
    };

    // Labels above the NMT target markers
    const targetLabels = {
      x: labelX,
      y: labelY,
      type: "scatter",
      mode: "text",
      name: "NMT FSI Target Labels",
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

    // === Layout ===
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
        title: "Nonmotorist Fatal & Serious Injuries",
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
        filename: "policy-target-setting-nmt-fsi",
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
