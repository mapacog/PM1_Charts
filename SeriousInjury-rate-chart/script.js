// === Helper: safe numeric conversion ===
function toNum(val) {
  if (val === null || val === undefined) return null;
  const cleaned = val.toString().replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

// === Helper: simple linear regression (y = m*x + b) ===
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

// === Load CSV and build chart ===
d3.csv("PM1_Viewer.csv")
  .then(function (rows) {
    const years = [];
    const fatalRate = [];
    const fatalRate5yr = [];
    const projPast = [];
    const projCurrent = [];
    const targetPast = [];
    const targetCurrent = [];
    const trend = [];

    rows.forEach((row) => {
      const year = parseInt(row["Year"], 10);
      if (Number.isNaN(year)) return;

      // keep only 2006–2024 (adjust if you like)
      if (year < 2006 || year > 2024) return;

      years.push(year);
      fatalRate.push(toNum(row["Fatality Rate (per 100M VMT)"]));
      fatalRate5yr.push(toNum(row["Fatality Rate (5-yr avg)"]));
      projPast.push(toNum(row["Fatality Rate Projection (Past)"]));
      projCurrent.push(toNum(row["Fatality Rate Projection (Current)"]));
      targetPast.push(toNum(row["Fatality Rate Target (Past)"]));
      targetCurrent.push(toNum(row["Fatality Rate Target (Current)"]));
      trend.push(toNum(row["Fatality Rate Trend"]));
    });

    // linear fit on actual fatality rate values
    const xsForFit = [];
    const ysForFit = [];
    for (let i = 0; i < years.length; i++) {
      if (fatalRate[i] != null) {
        xsForFit.push(years[i]);
        ysForFit.push(fatalRate[i]);
      }
    }
    const { m, b } = linearRegression(xsForFit, ysForFit);
    const linearFit = years.map((yr) => m * yr + b);

    // === Traces ===

    const barFatalRate = {
      x: years,
      y: fatalRate,
      type: "bar",
      name: "Fatality Rate",
      marker: {
        color: "rgba(84, 180, 216, 0.7)",
      },
      hovertemplate: "Fatality Rate: %{y:.3f}<extra></extra>",
    };

    const line5yr = {
      x: years,
      y: fatalRate5yr,
      type: "scatter",
      mode: "lines+markers",
      name: "Fatality Rate (5-yr avg)",
      line: { width: 3, color: "rgb(0, 90, 130)" },
      marker: { size: 6 },
      hovertemplate: "5-yr Avg: %{y:.3f}<extra></extra>",
    };

    const lineProjPast = {
      x: years,
      y: projPast,
      type: "scatter",
      mode: "lines+markers",
      name: "Fatality Rate Projection (Past)",
      line: { width: 2, color: "lightgrey", dash: "dot" },
      marker: { size: 6, color: "lightgrey" },
      hovertemplate: "Projection (Past): %{y:.3f}<extra></extra>",
    };

    const dotsProjCurrent = {
      x: years,
      y: projCurrent,
      type: "scatter",
      mode: "markers+text",
      name: "Fatality Rate Projection (Current)",
      marker: { size: 8, color: "black" },
      text: projCurrent.map((v) =>
        v == null ? "" : v.toFixed(3)
      ),
      textposition: "top center",
      textfont: { size: 11 },
      hovertemplate: "Projection (Current): %{y:.3f}<extra></extra>",
    };

    const starsTargetPast = {
      x: years,
      y: targetPast,
      type: "scatter",
      mode: "markers",
      name: "Fatality Rate Target (Past)",
      marker: { size: 10, color: "lightgrey", symbol: "star" },
      hovertemplate: "Target (Past): %{y:.3f}<extra></extra>",
    };

    const starsTargetCurrent = {
      x: years,
      y: targetCurrent,
      type: "scatter",
      mode: "markers+text",
      name: "Fatality Rate Target (Current)",
      marker: { size: 11, color: "rgb(0, 90, 130)", symbol: "star" },
      text: targetCurrent.map((v) =>
        v == null ? "" : v.toFixed(3)
      ),
      textposition: "top center",
      textfont: { size: 11 },
      hovertemplate: "Target (Current): %{y:.3f}<extra></extra>",
    };

    const lineTrend = {
      x: years,
      y: trend,
      type: "scatter",
      mode: "lines",
      name: "Fatality Rate Trend",
      line: { width: 2, color: "rgb(0, 180, 140)" },
      hovertemplate: "Trend: %{y:.3f}<extra></extra>",
    };

    const lineLinearFit = {
      x: years,
      y: linearFit,
      type: "scatter",
      mode: "lines",
      name: "Fatality Rate Trend Linear Fit",
      line: { width: 2, color: "red" },
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
        title: "Fatality Rate",
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
    };

    // 🔹 config: show only the camera "Download image" button
    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToKeep: ["toImage"], // only keep Save Image
      toImageButtonOptions: {
        format: "png",
        filename: "fatality-rate-100m-vmt",
        width: 1200,
        height: 600,
        scale: 1
      }
    };

    Plotly.newPlot(
      "chart",
      [
        barFatalRate,
        line5yr,
        lineProjPast,
        dotsProjCurrent,
        starsTargetPast,
        starsTargetCurrent,
        lineTrend,
        lineLinearFit,
      ],
      layout,
      config
    );
  })
  .catch(function (error) {
    console.error("Error loading CSV:", error);
  });
