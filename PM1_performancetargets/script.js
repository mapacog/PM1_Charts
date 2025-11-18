// === Helper: safe numeric conversion ===
function toNum(val) {
  if (val === null || val === undefined) return null;
  const cleaned = val.toString().replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

// === Inject minimal CSS for the table (only once) ===
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
      font-size: 0.95rem;
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
  `;
  document.head.appendChild(style);
})();

// === Load CSV and build MAPA PM1 Performance Targets table ===
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

    // Years used in the table header
    const baselineYear = 2023; // Baseline
    const projYear = 2024;     // Projected
    const targetYear = 2025;   // Target

    const baselineRow = byYear[baselineYear];
    const projRow = byYear[projYear];
    const targetRow = byYear[targetYear];

    if (!baselineRow || !projRow || !targetRow) {
      console.error(
        "Missing one of the required years: 2023 (baseline), 2024 (projected), 2025 (target)."
      );
      return;
    }

    const measures = [
      {
        label: "Fatalities (#)",
        baselineCol: "Fatalities (5-yr avg)",
        projectedCol: "Fatalities Projection (Current)",
        targetCol: "Fatalities Target (Current)",
        decimals: 1,
      },
      {
        label: "Fatality Rate (per 100M VMT)",
        baselineCol: "Fatality Rate (5-yr avg)",
        projectedCol: "Fatality Rate Projection (Current)",
        targetCol: "Fatality Rate Target (Current)",
        decimals: 3,
      },
      {
        label: "Serious Injuries (#)",
        baselineCol: "Serious Injuries (5-yr avg)",
        projectedCol: "Serious Injury Projection (Current)",
        targetCol: "Serious Injury Target (Current)",
        decimals: 1,
      },
      {
        label: "Serious Injury Rate (per 100M VMT)",
        baselineCol: "Serious Injury Rate (5-yr avg)",
        projectedCol: "Serious Injury Rate Projection (Current)",
        targetCol: "Serious Injury Rate Target (Current)",
        decimals: 3,
      },
      {
        label: "Non-Motorized (# Fatal & Serious Injuries)",
        baselineCol: "Nonmotorist Fatal & Serious Injuries (5-yr avg)",
        projectedCol: "Nonmotorists Projection (Current)",
        targetCol: "Nonmotorists Target (Current)",
        decimals: 1,
      },
    ];

    const tableRows = measures.map((m) => {
      const baselineVal = toNum(baselineRow[m.baselineCol]);
      const projectedVal = toNum(projRow[m.projectedCol]);
      const targetVal = toNum(targetRow[m.targetCol]);

      function fmt(v) {
        if (v == null || Number.isNaN(v)) return "";
        return v.toFixed(m.decimals);
      }

      return {
        label: m.label,
        baseline: fmt(baselineVal),
        projected: fmt(projectedVal),
        target: fmt(targetVal),
      };
    });

    // Render HTML table
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
              <th>${baselineYear} Baseline</th>
              <th>${projYear} Projected</th>
              <th>${targetYear} Target</th>
            </tr>
          </thead>
          <tbody>
    `;

    tableRows.forEach((r) => {
      html += `
        <tr>
          <td>${r.label}</td>
          <td>${r.baseline}</td>
          <td>${r.projected}</td>
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
