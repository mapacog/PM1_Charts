function toNum(val) {
  if (val === null || val === undefined) return null;
  const cleaned = val.toString().replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

// === Load CSV and build Non-motorist Fatal & Serious Injuries chart ===
d3.csv("PM1_Viewer.csv")
  .then(function (rows) {
    if (!rows || !rows.length) {
      console.error("CSV appears empty or failed to load.");
      return;
    }

    // --- Column helper (handles stray spaces in headers) ---
    const cols = Object.keys(rows[0]);
    function findCol(label) {
      return cols.find((c) => c.trim() === label) || label;
    }

    // Column names (non-motorist)
    const COL_YEAR         = findCol("Year");
    const COL_NONMOTOR     = findCol("Nonmotorist Fatal & Serious Injuries");
    const COL_NONMOTOR_5YR = findCol("Nonmotorist Fatal & Serious Injuries (5-yr avg)");
    const COL_PROJ_PAST    = findCol("Nonmotorists Projection (Past)");
    const COL_PROJ_CURR    = findCol("Nonmotorists Projection (Current)");
    const COL_TGT_PAST     = findCol("Nonmotorists Target (Past)");
    const COL_TGT_CURR     = findCol("Nonmotorists Target (Current)");
    const COL_TREND        = findCol("Nonmotorist Fatal & Serious Injuries Trend");

    const years = [];
    const nm = [];
    const nm5yr = [];
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

    // Dedicated arrays so target-current still plots even if only one year (e.g., 2025)
    const targetCurrentX = [];
    const targetCurrentY = [];

    const shapes = [];

    // Label offsets so values sit clearly above markers
    const projLabelOffset = 3.0;
    const targetLabelOffset = 3.5;

    rows.forEach((row) => {
      const rawYear = row[COL_YEAR];
      if (rawYear == null || rawYear.toString().trim() === "") return;

      const year = parseInt(rawYear, 10);
      if (Number.isNaN(year)) return;

      // Only show 2006–2025
      if (year < 2006 || year > 2025) return;

      const nmVal      = toNum(row[COL_NONMOTOR]);
      const nm5Val     = toNum(row[COL_NONMOTOR_5YR]);
      const projPastVal= toNum(row[COL_PROJ_PAST]);
      const projCurrVal= toNum(row[COL_PROJ_CURR]);
      const tgtPastVal = toNum(row[COL_TGT_PAST]);
      const tgtCurrVal = toNum(row[COL_TGT_CURR]);
      const trendVal   = toNum(row[COL_TREND]);

      years.push(year);
      nm.push(nmVal);
      nm5yr.push(nm5Val);
      projPast.push(projPastVal);
      projCurrent.push(projCurrVal);
      targetPast.push(tgtPastVal);
      targetCurrent.push(tgtCurrVal);
      trend.push(trendVal);

      // === Projection (Current) labels + dashed leader lines ===
      if (projCurrVal != null) {
        const yLabel = projCurrVal + projLabelOffset;

        projLabelX.push(year);
        projLabelY.push(yLabel);
        projLabelText.push(projCurrVal.toFixed(1));

        shapes.push({
          type: "line",
          x0: year,
          x1: year,
          y0: projCurrVal,
          y1: yLabel,
          line: {
            color: "#000000",
            width: 1.4,
            dash: "dot",
          },
        });
      }

      // === Target (Current) markers + labels + dashed leader lines ===
      if (tgtCurrVal != null) {
        targetCurrentX.push(year);
        targetCurrentY.push(tgtCurrVal);

        const yLabel = tgtCurrVal + targetLabelOffset;
        targetLabelX.push(year);
        targetLabelY.push(yLabel);
        targetLabelText.push(tgtCurrVal.toFixed(1));

        shapes.push({
          type: "line",
          x0: year,
          x1: year,
          y0: tgtCurrVal,
          y1: yLabel,
          line: {
            color: "rgb(0, 90, 130)",
            width: 1.4,
            dash: "dot",
          },
        });
      }
    });

    // === Trend linear fit using: y = -1.86 * X + 89.1 ===
    // X is index starting at 0 for the first year (2006), so it naturally extends to 2025.
    const linearFit = years.map((year, idx) => {
      const x = idx;
      return -1.86 * x + 89.1;
    });

    // === Traces ===

    // Bars: Non-motorist Fatal & Serious Injuries
    const barNonmotor = {
      x: years,
      y: nm,
      type: "bar",
      name: "Nonmotorist Fatal & Serious Injuries",
      marker: {
        // Distinct green (different from fatalities blue and serious-injury orange)
        color: "rgba(126, 200, 160, 0.75)",
      },
      hovertemplate: "Nonmotorist FSI: %{y:.0f}<extra></extra>",
    };

    // 5-year average line
    const line5yr = {
      x: years,
      y: nm5yr,
      type: "scatter",
      mode: "lines+markers",
      name: "Nonmotorist Fatal & Serious Injuries (5-yr avg)",
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
      name: "Nonmotorists Projection (Past)",
      line: { width: 2, color: "lightgrey", dash: "dot" },
      marker: { size: 7, color: "lightgrey" },
      hovertemplate: "Projection (Past): %{y:.1f}<extra></extra>",
    };

    // Projection (Current) – markers only
    const projCurrentDots = {
      x: years,
      y: projCurrent,
      type: "scatter",
      mode: "markers",
      name: "Nonmotorists Projection (Current)",
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
      name: "Nonmotorists Target (Past)",
      line: { width: 2, color: "lightgrey", dash: "dot" },
      marker: { size: 11, color: "lightgrey", symbol: "star" },
      hovertemplate: "Target (Past): %{y:.1f}<extra></extra>",
    };

    // Target (Current) – star markers
    const targetCurrentStars = {
      x: targetCurrentX,
      y: targetCurrentY,
      type: "scatter",
      mode: "markers",
      name: "Nonmotorists Target (Current)",
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

    // Nonmotorist FSI Trend as area (from CSV)
    const areaTrend = {
      x: years,
      y: trend,
      type: "scatter",
      mode: "lines",
      name: "Nonmotorist Fatal & Serious Injuries Trend",
      line: { width: 2, color: "rgba(126, 200, 160, 1)" },
      fill: "tozeroy",
      fillcolor: "rgba(126, 200, 160, 0.25)",
      hovertemplate: "Trend: %{y:.1f}<extra></extra>",
    };

    // Nonmotorist FSI Trend Linear Fit (red)
    const lineLinearFit = {
      x: years,
      y: linearFit,
      type: "scatter",
      mode: "lines",
      name: "Nonmotorist Fatal & Serious Injuries Trend Linear Fit",
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
        title: "Nonmotorist Fatal and Serious Injuries",
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
      margin: { l: 60, r: 260, t: 40, b: 70 },
      shapes: shapes, // dashed leader lines
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToKeep: ["toImage"],
      toImageButtonOptions: {
        format: "png",
        filename: "nonmotorist-fsi-number-chart",
        width: 1400,
        height: 650,
        scale: 1,
      },
    };

    Plotly.newPlot(
      "chart",
      [
        barNonmotor,
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
