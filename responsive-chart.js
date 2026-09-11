(function enableResponsivePm1Chart() {
  const MOBILE_BREAKPOINT = 700;
  const INTERACTION_BREAKPOINT = 1024;
  const chart = document.getElementById("chart");
  if (!chart) return;

  let initialized = false;
  let originalLayout = null;
  let lastMobileState = null;
  let lastInteractionLocked = null;
  let resizeObserver = null;
  let animationFrame = null;

  function plotIsReady() {
    return Boolean(
      window.Plotly &&
      Array.isArray(chart.data) &&
      chart.data.length &&
      chart.layout
    );
  }

  function valueOrNull(value) {
    return value === undefined ? null : value;
  }

  function captureOriginalLayout() {
    const layout = chart.layout || {};
    const margin = layout.margin || {};
    const legend = layout.legend || {};
    const xaxis = layout.xaxis || {};
    const yaxis = layout.yaxis || {};

    return {
      margin: {
        l: margin.l ?? 60,
        r: margin.r ?? 40,
        t: margin.t ?? 40,
        b: margin.b ?? 70,
      },
      legend: {
        orientation: legend.orientation ?? "v",
        x: valueOrNull(legend.x),
        y: valueOrNull(legend.y),
        xanchor: valueOrNull(legend.xanchor),
        yanchor: valueOrNull(legend.yanchor),
        fontSize: valueOrNull(legend.font && legend.font.size),
        bgcolor: valueOrNull(legend.bgcolor),
      },
      xaxis: {
        dtick: valueOrNull(xaxis.dtick),
        tickangle: valueOrNull(xaxis.tickangle),
        automargin: valueOrNull(xaxis.automargin),
        fixedrange: valueOrNull(xaxis.fixedrange),
      },
      yaxis: {
        automargin: valueOrNull(yaxis.automargin),
        fixedrange: valueOrNull(yaxis.fixedrange),
      },
      dragmode: valueOrNull(layout.dragmode),
    };
  }

  function visibleLegendCount() {
    return chart.data.filter(
      (trace) => trace && trace.showlegend !== false && trace.name
    ).length;
  }

  function initialize() {
    if (initialized || !plotIsReady()) return;
    initialized = true;
    originalLayout = captureOriginalLayout();

    const gauge = chart.data.every((trace) => trace.type === "indicator");
    if (gauge) document.documentElement.classList.add("pm1-gauge");

    resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(document.getElementById("page") || document.body);
    window.addEventListener("resize", scheduleResize, { passive: true });
    scheduleResize();
  }

  function scheduleResize() {
    if (!initialized) {
      initialize();
      return;
    }
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(applyResponsiveLayout);
  }

  function applyResponsiveLayout() {
    animationFrame = null;
    if (!plotIsReady()) return;

    const availableWidth =
      (chart.parentElement && chart.parentElement.clientWidth) ||
      document.documentElement.clientWidth;
    const isMobile = availableWidth <= MOBILE_BREAKPOINT;
    const hasCoarsePointer = Boolean(
      window.matchMedia && window.matchMedia("(pointer: coarse)").matches
    );
    const interactionLocked =
      availableWidth <= INTERACTION_BREAKPOINT || hasCoarsePointer;
    const isGauge = chart.data.every((trace) => trace.type === "indicator");

    if (isGauge) {
      window.Plotly.Plots.resize(chart);
      return;
    }

    if (
      isMobile === lastMobileState &&
      interactionLocked === lastInteractionLocked
    ) {
      window.Plotly.Plots.resize(chart);
      return;
    }
    lastMobileState = isMobile;
    lastInteractionLocked = interactionLocked;

    const originalDtick = Number(originalLayout.xaxis.dtick);
    const mobileDtick = Number.isFinite(originalDtick)
      ? Math.max(2, originalDtick)
      : 2;
    const mobileBottomMargin = Math.min(
      235,
      Math.max(115, 90 + visibleLegendCount() * 18)
    );

    const updates = isMobile
      ? {
          autosize: true,
          "margin.l": 58,
          "margin.r": 12,
          "margin.t": 24,
          "margin.b": mobileBottomMargin,
          "legend.orientation": "v",
          "legend.x": 0,
          "legend.y": -0.18,
          "legend.xanchor": "left",
          "legend.yanchor": "top",
          "legend.font.size": 10,
          "legend.bgcolor": "rgba(255,255,255,0.92)",
          "xaxis.dtick": mobileDtick,
          "xaxis.tickangle": -45,
          "xaxis.automargin": true,
          "yaxis.automargin": true,
        }
      : {
          autosize: true,
          "margin.l": originalLayout.margin.l,
          "margin.r": originalLayout.margin.r,
          "margin.t": originalLayout.margin.t,
          "margin.b": originalLayout.margin.b,
          "legend.orientation": originalLayout.legend.orientation,
          "legend.x": originalLayout.legend.x,
          "legend.y": originalLayout.legend.y,
          "legend.xanchor": originalLayout.legend.xanchor,
          "legend.yanchor": originalLayout.legend.yanchor,
          "legend.font.size": originalLayout.legend.fontSize,
          "legend.bgcolor": originalLayout.legend.bgcolor,
          "xaxis.dtick": originalLayout.xaxis.dtick,
          "xaxis.tickangle": originalLayout.xaxis.tickangle,
          "xaxis.automargin": originalLayout.xaxis.automargin,
          "yaxis.automargin": originalLayout.yaxis.automargin,
        };

    updates.dragmode = interactionLocked ? false : originalLayout.dragmode;
    updates["xaxis.fixedrange"] = interactionLocked
      ? true
      : originalLayout.xaxis.fixedrange;
    updates["yaxis.fixedrange"] = interactionLocked
      ? true
      : originalLayout.yaxis.fixedrange;

    window.Plotly.relayout(chart, updates).then(function () {
      window.Plotly.Plots.resize(chart);
    });
  }

  const plotObserver = new MutationObserver(function () {
    if (plotIsReady()) {
      initialize();
      if (initialized) plotObserver.disconnect();
    }
  });
  plotObserver.observe(chart, { childList: true, subtree: false });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
