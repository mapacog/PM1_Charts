// script.js  (Fatalities Gauge)

// === Helper: safe numeric conversion ===
function toNum(v) {
  if (v === null || v === undefined) return null;
  const c = v.toString().replace(/,/g, "").trim();
  if (c === "") return null;
  const n = parseFloat(c);
  return Number.isNaN(n) ? null : n;
}

// === Load CSV and build Fatalities gauge ===
d3.csv("PM1_Viewer.csv")
  .then(function (rows) {
    if (!rows || !rows.length) {
      console.error("PM1_Viewer.csv appears empty or failed to load.");
      return;
    }

    // Use year 2024, 5-yr avg vs Target (Past)
    const row2024 = rows.find(r => parseInt(r["Year"], 10) === 2024);
    if (!row2024) {
      console.error("No 2024 row found in PM1_Viewer.csv");
      return;
    }

    const observed   = toNum(row2024["Serious Injuries (5-yr avg)"]);
    const targetPast = toNum(row2024["Serious Injury Target (Past)"]);

    if (observed == null || targetPast == null) {
      console.error("Missing observed or target values for fatalities in 2024.");
      return;
    }

    // Set gauge max a bit above the larger of obs/target
    const axisMax = Math.max(observed, targetPast) * 1.25;

    const data = [
      {
        type: "indicator",
        mode: "gauge+number",
        value: observed,
        number: {
          valueformat: ".1f",
          font: { size: 20 }   // slightly reduced for cleaner look
        },
       
        gauge: {
          shape: "angular",
          startangle: -90,
          endangle: 90,
          axis: {
            range: [0, axisMax],
            tickwidth: 1,
            tickcolor: "#777",
          },
          bar: { color: "rgba(242, 107, 56, 0.75)" },

          // Green = good, Yellow = caution
          steps: [
            { range: [0, targetPast],       color: "rgba(111, 207, 151, 0.35)" },
            { range: [targetPast, axisMax], color: "rgba(255, 236, 179, 0.8)" },
          ],

          // Red line showing target threshold
          threshold: {
            line: { color: "#ea4335", width: 5 },
            value: targetPast,
          },
        },
        hovertemplate:
          "Observed (5-yr avg, 2024): %{value:.1f}<br>" +
          `Target:${targetPast.toFixed(1)}<extra></extra>`
      },
    ];

  
    const layout = {
      margin: { t: 80, b: 40, l: 20, r: 20 },
      height: 280,
      width: 420,
      annotations: [
        {
          x: 0.5,
          y: 0.2,
          xref: "paper",
          yref: "paper",
          showarrow: false,
          text: `Target: ≤ ${targetPast.toFixed(1)}`,
          font: {
            size: 15,
            color: "#ea4335",
            family: "Segoe UI, Arial, sans-serif",
          },
        },
      ],
    };

    // Plot — now with NO Plotly logo
    const config = {
      responsive: true,
      displayModeBar: true,
      scrollZoom: true,
      editable: false,
      displaylogo: false  // 🔥 This removes the Plotly trademark
    };

    Plotly.newPlot("chart", data, layout, config);
  })
  .catch(function (err) {
    console.error("Error loading or parsing PM1_Viewer.csv:", err);
  });
