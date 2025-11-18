function toNum(val) {
  if (val === null || val === undefined) return null;
  const cleaned = val.toString().replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

d3.csv("PM1_Viewer.csv")
  .then(function (rows) {
    const years = [];
    const fatalities = [];
    const fatal5yr = [];
    const projPast = [];
    const projCurrent = [];
    const targetPast = [];
    const targetCurrent = [];
    const trend = [];

    // For labels + leader lines (Current projection/target)
    const projLabelX = [];
    const projLabelY = [];
    const projLabelText = [];

    const targetLabelX = [];
    const targetLabelY = [];
    const targetLabelText = [];

    // Dedicated arrays for Target (Current) so even a single year (2025) plots
    const targetCurrentX = [];
    const targetCurrentY = [];

    const shapes = [];

    const projLabelOffset = 3.0;   // projection labels above markers
    const targetLabelOffset = 3.5; // target labels above markers

    rows.forEach((row) => {
      const year = parseInt(row["Year"], 10);
      if (Number.isNaN(year)) return;

      // Include all data from 2006 upward, including 2025
      if (year < 2006) return;

      const fat = toNum(row["Fatalities"]);
      const fat5 = toNum(row["Fatalities (5-yr avg)"]);
      const projP = toNum(row["Fatalities Projection (Past)"]);
      const projC = toNum(row["Fatalities Projection (Current)"]);
      const targP = toNum(row["Fatalities Target (Past)"]);
      const targC = toNum(row["Fatalities Target (Current)"]);
      const trendVal = toNum(row["Fatalities Trend"]);

      years.push(year);
      fatalities.push(fat);
      fatal5yr.push(fat5);
      projPast.push(projP);
      projCurrent.push(projC);
      targetPast.push(targP);
      targetCurrent.push(targC);
      trend.push(trendVal);

      // === Projection (Current) labels + dashed leader lines ===
      if (projC != null) {
        const yLabel = projC + projLabelOffset;

        projLabelX.push(year);
        projLabelY.push(yLabel);
        // keep decimals (one decimal place)
        projLabelText.push(projC.toFixed(1));

        shapes.push({
          type: "line",
          x0: year,
          x1: year,
          y0: projC,
          y1: yLabel,
          line: {
            color: "#000000",
            width: 1.4,
            dash: "dot",
          },
        });
      }

      // === Target (Current) markers + labels + dashed leader lines ===
      if (targC != null) {
        // ensure this plots even if only 2025 has data
        targetCurrentX.push(year);
        targetCurrentY.push(targC);

        const yLabel = targC + targetLabelOffset;
        targetLabelX.push(year);
        targetLabelY.push(yLabel);
        targetLabelText.push(targC.toFixed(1));

        shapes.push({
          type: "line",
          x0: year,
          x1: year,
          y0: targC,
          y1: yLabel,
          line: {
            color: "rgb(0, 90, 130)",
            width: 1.4,
            dash: "dot",
          },
        });
      }
    });

    // === Trend linear fit using the specified formula: y = -0.6 * X + 69.8 ===
    // X is index starting at 0 for the first year (2006), so it naturally extends to 2025.
    const linearFit = years.map((year, idx) => {
      const x = idx;
      return -0.6 * x + 69.8;
    });

    // === Traces ===

    // Bars: Fatalities (with labels inside at the bottom)
    const barFatalities = {
      x: years,
      y: fatalities,
      type: "bar",
      name: "Fatalities",
      marker: {
        color: "rgba(84, 180, 216, 0.75)",
      },
      text: fatalities.map((v) => (v == null ? "" : v.toFixed(0))),
      textposition: "inside",
      insidetextanchor: "start", // bottom-inside of the bar
      textfont: {
        size: 12,
        color: "#000000",
        family: "Segoe UI, Arial, sans-serif",
        // Plotly uses "bold" via separate style, we still put it here for emphasis
        weight: "bold",
      },
      hovertemplate: "Fatalities: %{y:.0f}<extra></extra>",
    };

    // 5-year average line
    const line5yr = {
      x: years,
      y: fatal5yr,
      type: "scatter",
      mode: "lines+markers",
      name: "Fatalities (5-yr avg)",
      line: { width: 3, color: "rgb(0, 90, 130)" },
      marker: { size: 6 },
      hovertemplate: "5-yr Avg: %{y:.0f}<extra></extra>",
    };

    // Projection (Past) – circle markers + dotted line
    const projPastLine = {
      x: years,
      y: projPast,
      type: "scatter",
      mode: "lines+markers",
      name: "Fatalities Projection (Past)",
      line: { width: 2, color: "lightgrey", dash: "dot" },
      marker: { size: 7, color: "lightgrey" },
      hovertemplate: "Projection (Past): %{y:.1f}<extra></extra>",
    };

    // Projection (Current) – markers only, keep decimals
    const projCurrentDots = {
      x: years,
      y: projCurrent,
      type: "scatter",
      mode: "markers",
      name: "Fatalities Projection (Current)",
      marker: { size: 8, color: "black" },
      hovertemplate: "Projection (Current): %{y:.1f}<extra></extra>",
    };

    // Projection (Current) labels
    const projCurrentLabels = {
      x: projLabelX,
      y: projLabelY,
      type: "scatter",
      mode: "text",
      text: projLabelText,
      textposition: "top center",
      textfont: {
        size: 12,
        color: "#000000",
        family: "Segoe UI, Arial, sans-serif",
        weight: "bold",
      },
      hoverinfo: "skip",
      showlegend: false,
    };

    // Target (Past) – star markers + dotted line
    const targetPastLine = {
      x: years,
      y: targetPast,
      type: "scatter",
      mode: "lines+markers",
      name: "Fatalities Target (Past)",
      line: { width: 2, color: "lightgrey", dash: "dot" },
      marker: { size: 11, color: "lightgrey", symbol: "star" },
      hovertemplate: "Target (Past): %{y:.1f}<extra></extra>",
    };

    // Target (Current) – star markers (only for non-null years, e.g., 2025)
    const targetCurrentStars = {
      x: targetCurrentX,
      y: targetCurrentY,
      type: "scatter",
      mode: "markers",
      name: "Fatalities Target (Current)",
      marker: { size: 12, color: "rgb(0, 90, 130)", symbol: "star" },
      hovertemplate: "Target (Current): %{y:.1f}<extra></extra>",
    };

    // Target (Current) labels
    const targetCurrentLabels = {
      x: targetLabelX,
      y: targetLabelY,
      type: "scatter",
      mode: "text",
      text: targetLabelText,
      textposition: "top center",
      textfont: {
        size: 12,
        color: "rgb(0, 90, 130)",
        family: "Segoe UI, Arial, sans-serif",
        weight: "bold",
      },
      hoverinfo: "skip",
      showlegend: false,
    };

    // Fatalities Trend as area (from CSV)
    const areaTrend = {
      x: years,
      y: trend,
      type: "scatter",
      mode: "lines",
      name: "Fatalities Trend",
      line: { width: 2, color: "rgb(0, 180, 140)" },
      fill: "tozeroy",
      fillcolor: "rgba(0, 180, 140, 0.25)",
      hovertemplate: "Trend: %{y:.1f}<extra></extra>",
    };

    // Fatalities Trend Linear Fit (red) – now extends to 2025
    const lineLinearFit = {
      x: years,
      y: linearFit,
      type: "scatter",
      mode: "lines",
      name: "Fatalities Trend Linear Fit",
      line: {
        width: 2.4,
        color: "#ea4335",
      },
      opacity: 0.75,
      hovertemplate: "Linear Fit: %{y:.1f}<extra></extra>",
    };

    // === Layout ===
    const layout = {
      title: "",
      xaxis: {
        tickmode: "linear",
        dtick: 1,
        showgrid: false,
        zeroline: false,
        tickangle: -45,
      },
      yaxis: {
        title: "Number of Fatalities",
        rangemode: "tozero",
        showgrid: true,
      },
      bargap: 0.15,
      hovermode: "x unified",
      legend: {
        orientation: "v",
        x: 1.02,
        y: 1,
      },
      margin: { l: 60, r: 240, t: 40, b: 70 },
      // Dashed leader lines for Projection (Current) & Target (Current)
      shapes: shapes,
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToKeep: ["toImage"],
      toImageButtonOptions: {
        format: "png",
        filename: "fatalities-number-chart",
        width: 1400,
        height: 650,
        scale: 1,
      },
    };

    Plotly.newPlot(
      "chart",
      [
        barFatalities,
        line5yr,
        projPastLine,
        projCurrentDots,
        projCurrentLabels,
        targetPastLine,
        targetCurrentStars,
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
