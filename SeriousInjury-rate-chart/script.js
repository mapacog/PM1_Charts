// === Helper: safe numeric conversion ===
function toNum(val) {
  if (val === null || val === undefined) return null;
  const cleaned = val.toString().replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

// === Load CSV and build chart ===
d3.csv("PM1_Viewer.csv")
  .then(function (rows) {
    const years = [];
    const seriousRate = [];
    const seriousRate5yr = [];
    const projPast = [];
    const projCurrent = [];
    const targetPast = [];
    const trend = [];

    // For labels + leader lines
    const projLabelX = [];
    const projLabelY = [];
    const projLabelText = [];

    const targetLabelX = [];
    const targetLabelY = [];
    const targetLabelText = [];

    // Target (Current) needs its own X/Y so a single-year value still plots
    const targetCurrentX = [];
    const targetCurrentY = [];

    const shapes = [];

    // Separate offsets to avoid clutter
    const projLabelOffset = 0.1;  // projection labels a bit above points
    const targetLabelOffset = 0.8; // target labels higher above points

    rows.forEach((row) => {
      const year = parseInt(row["Year"], 10);
      if (Number.isNaN(year)) return;

      // include all years from 2006 upward
      if (year < 2006) return;

      // some files might use "Serious Injury Rate (per 100M VMT)" instead
      const srate =
        toNum(row["Serious Injury Rate"]) ??
        toNum(row["Serious Injury Rate (per 100M VMT)"]);

      const srate5 = toNum(row["Serious Injury Rate (5-yr avg)"]);
      const projP = toNum(row["Serious Injury Rate Projection (Past)"]);
      const projC = toNum(row["Serious Injury Rate Projection (Current)"]);
      const targP = toNum(row["Serious Injury Rate Target (Past)"]);
      const targC = toNum(row["Serious Injury Rate Target (Current)"]);
      const trendVal = toNum(row["Serious Injury Rate Trend"]);

      years.push(year);
      seriousRate.push(srate);
      seriousRate5yr.push(srate5);
      projPast.push(projP);
      projCurrent.push(projC);
      targetPast.push(targP);
      trend.push(trendVal);

      // Labels + leader lines for Projection (Current)
      if (projC != null) {
        const yLabel = projC + projLabelOffset;
        projLabelX.push(year);
        projLabelY.push(yLabel);
        projLabelText.push(projC.toFixed(3));

        shapes.push({
          type: "line",
          x0: year,
          x1: year,
          y0: projC,
          y1: yLabel,
          line: {
            color: "black",
            width: 1,
            dash: "dot",
          },
        });
      }

      // Points + labels + leader lines for Target (Current)
      if (targC != null) {
        targetCurrentX.push(year);
        targetCurrentY.push(targC);

        const yLabel = targC + targetLabelOffset;
        targetLabelX.push(year);
        targetLabelY.push(yLabel);
        targetLabelText.push(targC.toFixed(3));

        shapes.push({
          type: "line",
          x0: year,
          x1: year,
          y0: targC,
          y1: yLabel,
          line: {
            color: "rgb(0, 90, 130)",
            width: 1,
            dash: "dot",
          },
        });
      }
    });

    // === Trend Linear Fit from formula y = -0.0108*X + 1.1 ===
    // X is index starting at 0 for the first year (2006)
    const linearFit = years.map((year, idx) => {
      const x = idx; // year index from 0
      return -0.211 * x + 10.8;
    });

    // === Traces ===

    // Bars: Serious Injury Rate
    const barSeriousRate = {
      x: years,
      y: seriousRate,
      type: "bar",
      name: "Serious Injury Rate",
      marker: {
        color: "rgba(84, 180, 216, 0.7)",
      },
      hovertemplate: "Serious Injury Rate: %{y:.3f}<extra></extra>",
    };

    // 5-year average
    const line5yr = {
      x: years,
      y: seriousRate5yr,
      type: "scatter",
      mode: "lines+markers",
      name: "Serious Injury Rate (5-yr avg)",
      line: { width: 3, color: "rgb(0, 90, 130)" },
      marker: { size: 6 },
      hovertemplate: "5-yr Avg: %{y:.3f}<extra></extra>",
    };

    // Projection (Past) – circle markers + dotted line
    const lineProjPast = {
      x: years,
      y: projPast,
      type: "scatter",
      mode: "lines+markers",
      name: "Serious Injury Rate Projection (Past)",
      line: { width: 2, color: "lightgrey", dash: "dot" },
      marker: { size: 6, color: "lightgrey" },
      hovertemplate: "Projection (Past): %{y:.3f}<extra></extra>",
    };

    // Projection (Current) – markers
    const dotsProjCurrent = {
      x: years,
      y: projCurrent,
      type: "scatter",
      mode: "markers",
      name: "Serious Injury Rate Projection (Current)",
      marker: { size: 8, color: "black" },
      hovertemplate: "Projection (Current): %{y:.3f}<extra></extra>",
    };

    // Projection (Current) labels
    const projCurrentLabels = {
      x: projLabelX,
      y: projLabelY,
      type: "scatter",
      mode: "text",
      name: "Serious Injury Rate Projection (Current) Labels",
      text: projLabelText,
      textposition: "top center",
      textfont: { size: 10, color: "black" },
      hoverinfo: "skip",
      showlegend: false,
    };

    // Target (Past) – star markers + dotted line
    const starsTargetPast = {
      x: years,
      y: targetPast,
      type: "scatter",
      mode: "lines+markers",
      name: "Serious Injury Rate Target (Past)",
      line: { width: 2, color: "lightgrey", dash: "dot" },
      marker: { size: 10, color: "lightgrey", symbol: "star" },
      hovertemplate: "Target (Past): %{y:.3f}<extra></extra>",
    };

    // Target (Current) – star markers (only where we have data)
    const starsTargetCurrent = {
      x: targetCurrentX,
      y: targetCurrentY,
      type: "scatter",
      mode: "markers",
      name: "Serious Injury Rate Target (Current)",
      marker: { size: 11, color: "rgb(0, 90, 130)", symbol: "star" },
      hovertemplate: "Target (Current): %{y:.3f}<extra></extra>",
    };

    // Target (Current) labels
    const targetCurrentLabels = {
      x: targetLabelX,
      y: targetLabelY,
      type: "scatter",
      mode: "text",
      name: "Serious Injury Rate Target (Current) Labels",
      text: targetLabelText,
      textposition: "top center",
      textfont: { size: 10, color: "rgb(0, 90, 130)" },
      hoverinfo: "skip",
      showlegend: false,
    };

    // Serious Injury Rate Trend as AREA (from CSV)
    const areaTrend = {
      x: years,
      y: trend,
      type: "scatter",
      mode: "lines",
      name: "Serious Injury Rate Trend",
      line: { width: 2, color: "rgb(0, 180, 140)" },
      fill: "tozeroy",
      fillcolor: "rgba(0, 180, 140, 0.2)", // ~30% opacity area
      hovertemplate: "Trend: %{y:.3f}<extra></extra>",
    };

    // Serious Injury Rate Trend Linear Fit (red)
    const lineLinearFit = {
      x: years,
      y: linearFit,
      type: "scatter",
      mode: "lines",
      name: "Serious Injury Rate Trend Linear Fit",
      line: {
        width: 2,
        color: "#ea4335",
      },
      opacity: 0.7, // 70% opacity
      hovertemplate: "Linear Fit: %{y:.3f}<extra></extra>",
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
      },
      yaxis: {
        title: "Serious Injury Rate (per 100M VMT)",
        rangemode: "tozero",
        showgrid: true,
      },
      bargap: 0.12,
      hovermode: "x unified",
      legend: {
        orientation: "v",
        x: 1.02,
        y: 1,
      },
      margin: { l: 60, r: 220, t: 40, b: 70 },

      // dashed leader lines for projection/target labels
      shapes: shapes,
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToKeep: ["toImage"],
      toImageButtonOptions: {
        format: "png",
        filename: "serious-injury-rate-100m-vmt",
        width: 1200,
        height: 600,
        scale: 1,
      },
    };

    Plotly.newPlot(
      "chart",
      [
        barSeriousRate,
        line5yr,
        lineProjPast,
        dotsProjCurrent,
        projCurrentLabels,
        starsTargetPast,
        starsTargetCurrent,
        targetCurrentLabels,
        areaTrend,
        lineLinearFit,
      ],
      layout,
      config
    );
  })
  .catch(function (error) {
    console.error("Error loading CSV:", error);
  });
