const apiUrl = 'https://api.sheetbest.com/sheets/1655a791-4d3c-412f-961e-c2d306e7ea4b';
const apiResumenUrl = 'https://api.sheetbest.com/sheets/9e5e9097-2429-4223-913c-e507e483458d'; // URL de hoja de resumen
const haciendaSelector = document.getElementById('haciendaSelector');
const resumenBtn = document.getElementById('resumenBtn');
const resumenSection = document.getElementById('resumenSection');
const nombreHaciendaResumen = document.getElementById('nombreHaciendaResumen');

const racimosCtx = document.getElementById('racimosChart').getContext('2d');
const cajasCtx = document.getElementById('cajasChart').getContext('2d');

let racimosChart, cajasChart;
let fullData = [];

resumenBtn.addEventListener('click', () => {
  const hacienda = haciendaSelector.value;
  nombreHaciendaResumen.textContent = hacienda;
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  resumenSection.style.display = 'block';

  fetch(apiResumenUrl)
    .then(res => res.json())
    .then(data => {
      console.log("Resumen cargado para:", hacienda);
    });
});

function createCharts() 
{racimosChart = new Chart(racimosCtx, {type: 'bar', data: { labels: [], datasets: [] }, 

    options: {
        indexAxis: 'y', 
        responsive: true, 
        maintainAspectRatio: false,
        layout: {
            padding: {
            top: 0,
            bottom: 0

            }
        }, 

      plugins: {
        legend: { position: 'top' },
        datalabels: {anchor: 'end', align: 'right', color: 'black', font: { weight: 'bold', size: 12} },
        tooltip: {enabled: true,
          callbacks: {
            label: function(context) {
              const datasetLabel = context.dataset.label || '';
              const value = context.parsed.x;
              const semana = context.chart.data.labels[context.dataIndex];
              const hacienda = haciendaSelector.value;

              if (datasetLabel === 'Rechazados') {
                const filasCausas = fullData.filter(r =>
                  r.Hacienda === hacienda &&
                  r.Semana === semana &&
                  (!r['Racimos Cosechados'] || r['Racimos Cosechados'] === '')
                );

                let causas = [];

                if (filasCausas.length > 0) {
                  const todasLasClaves = Object.keys(filasCausas[0]);
                  const causasPosibles = todasLasClaves.filter(k =>
                    !['Semana', 'Hacienda', 'Racimos Cosechados', 'Procesados', 'Rechazados', 'Cajas', 'Rathio'].includes(k)
                  );

                  const sumaPorCausa = {};
                  for (const fila of filasCausas) {
                    for (const causa of causasPosibles) {
                      const valor = +fila[causa] || 0;
                      if (valor > 0) {
                        sumaPorCausa[causa] = (sumaPorCausa[causa] || 0) + valor;
                      }
                    }
                  }

                  const ordenado = Object.entries(sumaPorCausa).sort((a, b) => b[1] - a[1]);
                  causas = ordenado.map(([nombre, valor]) => `${nombre}: ${valor}`);
                }

                return [`${datasetLabel}: ${value}`, ...causas];
              }

              return `${datasetLabel}: ${value}`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          categoryPercentage: 3.0,
          barPercentage: 3.8,          
        }
      }
    },
    plugins: [ChartDataLabels]
  });

  cajasChart = new Chart(cajasCtx, {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        datalabels: {
          anchor: 'end',
          align: 'right',
          color: 'black',
          font: { weight: 'bold' }
        }
      },
      scales: { x: { beginAtZero: true } }
    },
    plugins: [ChartDataLabels]
  });
}

function updateCharts(data) {
  const semanas = data.map(row => row.Semana);
  const racimosCosechados = data.map(row => +row['Racimos Cosechados'] || 0);
  const racimosProcesados = data.map(row => +row['Procesados'] || 0);
  const racimosRechazados = data.map(row => +row['Rechazados'] || 0);

  racimosChart.data.labels = semanas;

  //variable//
  let categoryPercentage=1, barPercentage=0.8
  
  racimosChart.data.datasets = [
    { label: 'Racimos Cosechados', data: racimosCosechados, backgroundColor: 'rgba(200,200,200,0.6)', 
        borderRadius: 8,
        categoryPercentage,
        barPercentage, 
    },

    { label: 'Procesados', data: racimosProcesados, backgroundColor: 'rgba(100,200,100,0.6)', 
        borderRadius: 8,
        categoryPercentage,
        barPercentage, 
    },
    { label: 'Rechazados', data: racimosRechazados, backgroundColor: 'rgba(255,99,132,0.6)', 
        borderRadius: 8,
        categoryPercentage,
        barPercentage, 
    }
  ];
  racimosChart.update();

  const cajasTotales = data.map(row => +row['Cajas'] || 0);
  const rathio = data.map(row => +row['Rathio'] || 0);

  cajasChart.data.labels = semanas;
  cajasChart.data.datasets = [
    { label: 'Cajas Totales', data: cajasTotales, backgroundColor: 'rgba(54,162,235,0.6)', borderRadius: 8 },
    { label: 'RATHIO', data: rathio, backgroundColor: 'rgba(255,206,86,0.6)', borderRadius: 8 }
  ];
  cajasChart.update();
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    resumenSection.style.display = 'none';

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

    tab.classList.add('active');
    const targetId = tab.getAttribute('data-tab');
    document.getElementById(targetId).style.display = 'block';
  });
});

function fetchAndRender() {
  const selected = haciendaSelector.value;
  const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');

  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      fullData = data;
      const filtrado = data.filter(r =>
        r.Hacienda === selected &&
        r['Racimos Cosechados'] !== undefined &&
        r['Racimos Cosechados'] !== ''
      );
      updateCharts(filtrado);

      document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === activeTab);
      });
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === activeTab);
      });
    });
}

haciendaSelector.addEventListener('change', fetchAndRender);
document.getElementById('modal').addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
});

createCharts();
fetchAndRender();