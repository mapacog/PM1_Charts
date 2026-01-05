function toNum(val) {
  if (val === null || val === undefined) return null;
  const cleaned = val.toString().replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

(function injectPm1TableCss() {
  if (document.getElementById("pm1-table-style")) return;
  const style = document.createElement("style");
  style.id = "pm1-table-style";
  style.textContent = `
    .pm1-table-wrapper {
      max-width: 1100px;
      margin: 0 auto;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .pm1-table {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
      font-size: 0.8rem;
    }
    .pm1-table thead {
      background-color: #005a5f;
      color: #ffffff;
    }
    .pm1-table th,
    .pm1-table td {
      border: 1px solid #d0d0d0;
      padding: 6px 10px;
      text-align: right;
      vertical-align: middle;
      white-space: nowrap;
    }
    .pm1-table th:first-child,
    .pm1-table td:first-child {
      text-align: left;
      font-weight: 600;
      padding-left: 12px;
    }
    .pm1-table tbody tr:nth-child(odd) {
      background-color: #f9f9f9;
    }
    .pm1-table tbody tr:nth-child(even) {
      background-color: #ffffff;
    }
    .pm1-table td.check-cell {
      text-align: center;
    }
    .pm1-table td.check-cell input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
})();

d3.csv("PM1_Viewer.csv")
  .then(function (rows) {
    if (!rows || !rows.length) {
      console.error("PM1_Viewer.csv appears empty or failed to load.");
      return;
    }

    // Map rows by Year for quick lookup
    const byYear = {};
    rows.forEach((row) => {
      const year = parseInt(row["Year"], 10);
      if (!Number.isNaN(year)) {
        byYear[year] = row;
      }
    });

    // 🔁 Updated years:
    const baselineYear = 2022; // Baseline
    const projYear = 2024;     // Projected & Observed
    const targetYear = 2026;   // Targets

    const baselineRow = byYear[baselineYear];
    const projRow = byYear[projYear];
    const targetRow = byYear[targetYear];

    if (!baselineRow || !projRow || !targetRow) {
      console.error("Missing one of the required years: 2022 (baseline), 2024 (proj/obs), 2026 (targets).");
      return;
    }

    // When measures are "lower it is indicative of  improvement"
    const measures = [
      {
        label: "Fatalities (#)",
        baselineCol: "Fatalities (5-yr avg)",
        projectedCol: "Fatalities Projection (Past)",
        observedCol: "Fatalities (5-yr avg)",
        targetCol: "Fatalities Target (Current)",
        decimals: 1,
      },
      {
        label: "Fatality Rate (per 100M VMT)",
        baselineCol: "Fatality Rate (5-yr avg)",
        projectedCol: "Fatality Rate Projection (Past)",
        observedCol: "Fatality Rate (5-yr avg)",
        targetCol: "Fatality Rate Target (Current)",
        decimals: 3,
      },
      {
        label: "Serious Injuries (#)",
        baselineCol: "Serious Injuries (5-yr avg)",
        projectedCol: "Serious Injury Projection (Past)",
        observedCol: "Serious Injuries (5-yr avg)",
        targetCol: "Serious Injury Target (Current)",
        decimals: 1,
      },
      {
        label: "Serious Injury Rate (per 100M VMT)",
        baselineCol: "Serious Injury Rate (5-yr avg)",
        projectedCol: "Serious Injury Rate Projection (Past)",
        observedCol: "Serious Injury Rate (5-yr avg)",
        targetCol: "Serious Injury Rate Target (Current)",
        decimals: 3,
      },
      {
        label: "Non-Motorized (# Fatal & Serious Injuries)",
        baselineCol: "Nonmotorist Fatal & Serious Injuries (5-yr avg)",
        projectedCol: "Nonmotorists Projection (Past)",
        observedCol: "Nonmotorist Fatal & Serious Injuries (5-yr avg)",
        targetCol: "Nonmotorists Target (Current)",
        decimals: 1,
      },
    ];

    // Building row data objects
    const tableRows = measures.map((m) => {
      const baselineVal = toNum(baselineRow[m.baselineCol]);
      const projectedVal = toNum(projRow[m.projectedCol]);
      const observedVal = toNum(projRow[m.observedCol]);
      const targetVal = toNum(targetRow[m.targetCol]);

      // "lower is better" logic
      const metTarget =
        baselineVal != null &&
        observedVal != null &&
        targetVal != null &&
        observedVal <= projectedVal;

      const betterThanBaseline =
        baselineVal != null &&
        observedVal != null &&
        observedVal <= baselineVal;

      function fmt(v) {
        if (v == null || Number.isNaN(v)) return "";
        return v.toFixed(m.decimals);
      }

      return {
        label: m.label,
        baseline: fmt(baselineVal),
        projected: fmt(projectedVal),
        observed: fmt(observedVal),
        target: fmt(targetVal),
        metTarget,
        betterThanBaseline,
      };
    });

    // Rendering HTML table
    const container = document.getElementById("pm1-table");
    if (!container) {
      console.error('No element with id="pm1-table" found in the DOM.');
      return;
    }

    let html = `
      <div class="pm1-table-wrapper">
        <table class="pm1-table">
          <thead>
            <tr>
              <th>Measure (5-Year Rolling Average)</th>
              <th>Baseline<br>(${baselineYear})</th>
              <th>${projYear} Projected</th>
              <th>${projYear} Observed</th>
              <th>Met Target</th>
              <th>Better than Baseline</th>
              <th>${targetYear} Targets</th>
            </tr>
          </thead>
          <tbody>
    `;

    tableRows.forEach((r, idx) => {
      html += `
        <tr>
          <td>${r.label}</td>
          <td>${r.baseline}</td>
          <td>${r.projected}</td>
          <td>${r.observed}</td>
          <td class="check-cell">
            <input type="checkbox" ${r.metTarget ? "checked" : ""} data-row="${idx}" data-type="metTarget" />
          </td>
          <td class="check-cell">
            <input type="checkbox" ${r.betterThanBaseline ? "checked" : ""} data-row="${idx}" data-type="betterBaseline" />
          </td>
          <td>${r.target}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  })
  .catch(function (error) {
    console.error("Error loading PM1_Viewer.csv:", error);
  });
