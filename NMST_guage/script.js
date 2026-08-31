function toNum(v) {
  if (v === null || v === undefined) return null;
  const c = v.toString().replace(/,/g, "").trim();
  if (c === "") return null;
  const n = parseFloat(c);
  return Number.isNaN(n) ? null : n;
}

d3.csv(`PM1_Viewer.csv?ts=${Date.now()}`)
  .then(function (rows) {
    if (!rows || !rows.length) {
      console.error("PM1_Viewer.csv appears empty or failed to load.");
      return;
    }

    const mainYear = 2025;
    const observedRow = rows.find(r => parseInt(r["Year"], 10) === mainYear);
    if (!observedRow) {
      console.error("No observed nonmotorist rolling-average row found in PM1_Viewer.csv");
      return;
    }

    const observedYear = mainYear;
    const observed   = toNum(observedRow["Nonmotorist Fatal & Serious Injuries (5-yr avg)"]);
    const targetPast =
      toNum(observedRow["Nonmotorists Target (Current)"]) ??
      toNum(observedRow["Nonmotorists Target (Past)"]);

    if (observed == null || targetPast == null) {
      console.error(`Missing observed or past-target nonmotorist FSI for ${observedYear}.`);
      return;
    }

    document.title = `Nonmotorist FSI (5-Year Rolling Avg, ${observedYear})`;
    const subtitle = document.querySelector(".subtitle");
    if (subtitle) subtitle.textContent = `5-Year Rolling Avg, ${observedYear}`;

    // Setting gauge max a bit above the larger of obs/target
    const axisMax = Math.max(observed, targetPast) * 1.25;

    const data = [
      {
        type: "indicator",
        mode: "gauge+number",
        value: observed,
        number: {
          valueformat: ".1f",
          font: { size: 20 }   // It is slightly reduced for cleaner look
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
          bar: { color: "rgba(126, 200, 160, 0.75)" },

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
          `Observed (5-yr avg, ${observedYear}): %{value:.1f}<br>` +
          `Target:${targetPast.toFixed(1)}<extra></extra>`
      },
    ];

    const layout = {
      autosize: true,
      margin: { t: 80, b: 40, l: 20, r: 20 },
      height: 280,
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

    const config = {
      responsive: true,
      displayModeBar: true,
      scrollZoom: true,
      editable: false,
      displaylogo: false  // This removes the Plotly trademark
    };

    Plotly.newPlot("chart", data, layout, config);
  })
  .catch(function (err) {
    console.error("Error loading or parsing PM1_Viewer.csv:", err);
  });
