function toNum(val) {
  if (val === null || val === undefined) return null;
  const cleaned = val.toString().replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

d3.csv("PM1_Viewer.csv")
  .then(function (rows) {
    if (!rows || !rows.length) {
      console.error("CSV appears empty or failed to load.");
      return;
    }

    // Handles possible slight differences in column naming
    const cols = Object.keys(rows[0]);
    function findCol(label) {
      return cols.find((c) => c.trim() === label) || label;
    }

    const COL_YEAR = findCol("Year");
    const COL_VMT  = findCol("VMT (Million vehicle-miles traveled)");

    const yearsActual = [];   // solid line
    const vmtActual   = [];

    const yearsEst = [];      // dashed line
    const vmtEst   = [];

    rows.forEach((row) => {
      const rawYear = row[COL_YEAR];
      if (rawYear == null || rawYear.toString().trim() === "") return;

      const year = parseInt(rawYear, 10);
      if (Number.isNaN(year)) return;

      // Only show 2006–2026
      if (year < 2006 || year > 2026) return;

      const vmtVal =
        toNum(row[COL_VMT]) ??
        toNum(row["VMT"]) ??
        null;

      if (vmtVal == null) return;

      // 1) Actual VMT (Millions): 2006–2023
      if (year <= 2023) {
        yearsActual.push(year);
        vmtActual.push(vmtVal);
      }

      // 2) Estimated VMT (Millions): start at 2023 to avoid visual gap,
      // then continue through 2024–2026
      if (year >= 2023 && year <= 2026) {
        yearsEst.push(year);
        vmtEst.push(vmtVal);
      }
    });

    // === Traces ===

    // Solid line: historical VMT up through 2023
    const lineVMT = {
      x: yearsActual,
      y: vmtActual,
      type: "scatter",
      mode: "lines",
      name: "VMT (Millions)",
      line: {
        width: 4.5, // thicker line
        color: "rgb(0, 90, 95)",
      },
      hovertemplate: "Year %{x}<br>VMT: %{y:,.0f} million<extra></extra>",
    };

    // Dashed line: Estimated VMT 2023–2026 (shares the 2023 point -> no gap)
    const lineVMT_Est = {
      x: yearsEst,
      y: vmtEst,
      type: "scatter",
      mode: "lines",
      name: "Estimated VMT (Millions)",
      line: {
        width: 4.5,       // thicker dashed line
        color: "rgb(0, 90, 95)",
        dash: "dash",
      },
      hovertemplate: "Year %{x}<br>Estimated VMT: %{y:,.0f} million<extra></extra>",
    };

    // === Layout ===
    const layout = {
      title: "",
      xaxis: {
        tickmode: "linear",
        dtick: 2,
        showgrid: true,              // vertical grid lines
        gridcolor: "rgba(0,0,0,0.1)",
        zeroline: false,
        tickangle: -45,
      },
      yaxis: {
        title: "Million Vehicle Miles Traveled",
        rangemode: "tozero",
        showgrid: true,              // horizontal grid lines
        gridcolor: "rgba(0,0,0,0.1)",
      },
      hovermode: "x unified",
      legend: {
        orientation: "h",
        x: 0.5,
        y: -0.2,
        xanchor: "center",
      },
      margin: { l: 80, r: 40, t: 20, b: 80 },
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToKeep: ["toImage"],
      toImageButtonOptions: {
        format: "png",
        filename: "regional-traffic-volumes",
        width: 1200,
        height: 600,
        scale: 1,
      },
    };

    Plotly.newPlot("chart", [lineVMT, lineVMT_Est], layout, config);
  })
  .catch(function (error) {
    console.error("Error loading CSV:", error);
  });
