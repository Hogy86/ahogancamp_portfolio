// Fictional but reasonable data for US-based companies
const companies = [
  { name: "TechNova", adoption: 88, aiRevenueShare: 42 },
  { name: "FinSight", adoption: 76, aiRevenueShare: 35 },
  { name: "HealthReach", adoption: 64, aiRevenueShare: 27 },
  { name: "RetailFlow", adoption: 55, aiRevenueShare: 18 },
  { name: "LogiChain", adoption: 49, aiRevenueShare: 14 },
  { name: "AutoPilotCo", adoption: 92, aiRevenueShare: 58 },
];

function createAdoptionRevenueChart(ctx) {
  const labels = companies.map((c) => c.name);
  const adoption = companies.map((c) => c.adoption);
  const revenueShare = companies.map((c) => c.aiRevenueShare);

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          type: "bar",
          label: "AI Adoption (% of workflows)",
          data: adoption,
          borderRadius: 10,
          backgroundColor: "rgba(56, 189, 248, 0.65)",
          hoverBackgroundColor: "rgba(56, 189, 248, 0.9)",
          borderWidth: 0,
          yAxisID: "y",
        },
        {
          type: "line",
          label: "AI Revenue Share (% of total revenue)",
          data: revenueShare,
          borderColor: "#f97316",
          backgroundColor: "rgba(248, 156, 84, 0.18)",
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 5,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          labels: {
            color: "#e5e7eb",
          },
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderColor: "rgba(148, 163, 184, 0.5)",
          borderWidth: 1,
          padding: 10,
          titleColor: "#e5e7eb",
          bodyColor: "#e5e7eb",
          displayColors: true,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#9ca3af",
            maxRotation: 0,
          },
        },
        y: {
          position: "left",
          beginAtZero: true,
          max: 100,
          ticks: {
            color: "#9ca3af",
            callback: (value) => value + "%",
          },
          title: {
            display: true,
            text: "Adoption",
            color: "#9ca3af",
          },
          grid: {
            color: "rgba(148, 163, 184, 0.18)",
          },
        },
        y1: {
          position: "right",
          beginAtZero: true,
          max: 70,
          ticks: {
            color: "#9ca3af",
            callback: (value) => value + "%",
          },
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: "AI Revenue Share",
            color: "#9ca3af",
          },
        },
      },
    },
  });
}

function createCorrelationChart(ctx) {
  const dataPoints = companies.map((c) => ({
    x: c.adoption,
    y: c.aiRevenueShare,
    label: c.name,
  }));

  return new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Company",
          data: dataPoints,
          backgroundColor: "rgba(56, 189, 248, 0.9)",
          borderColor: "#38bdf8",
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderColor: "rgba(148, 163, 184, 0.5)",
          borderWidth: 1,
          padding: 9,
          titleColor: "#e5e7eb",
          bodyColor: "#e5e7eb",
          callbacks: {
            title: (items) => items[0].raw.label,
            label: (item) =>
              ` Adoption: ${item.raw.x}% | AI Revenue: ${item.raw.y}%`,
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "AI Adoption (% of key workflows)",
            color: "#9ca3af",
          },
          min: 40,
          max: 100,
          ticks: {
            color: "#9ca3af",
            callback: (value) => value + "%",
          },
          grid: {
            color: "rgba(148, 163, 184, 0.18)",
          },
        },
        y: {
          title: {
            display: true,
            text: "AI Revenue Share (% of total revenue)",
            color: "#9ca3af",
          },
          min: 10,
          max: 65,
          ticks: {
            color: "#9ca3af",
            callback: (value) => value + "%",
          },
          grid: {
            color: "rgba(148, 163, 184, 0.18)",
          },
        },
      },
    },
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const adoptionCanvas = document.getElementById("adoptionRevenueChart");
  const correlationCanvas = document.getElementById("correlationChart");

  if (adoptionCanvas && correlationCanvas) {
    createAdoptionRevenueChart(adoptionCanvas.getContext("2d"));
    createCorrelationChart(correlationCanvas.getContext("2d"));
  }
});

