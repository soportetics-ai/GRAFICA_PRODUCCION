const apiUrl = 'https://api.sheetbest.com/sheets/1655a791-4d3c-412f-961e-c2d306e7ea4b';
const apiResumenUrl = 'https://api.sheetbest.com/sheets/9e5e9097-2429-4223-913c-e507e483458d'; 
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
  const magicLoader = document.getElementById('magic-loader');

  if (magicLoader) magicLoader.classList.remove('hidden');

  setTimeout(() => {
    if (magicLoader) magicLoader.classList.add('hidden');

    nombreHaciendaResumen.textContent = hacienda;
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    resumenSection.style.display = 'block';

    generarResumen(hacienda);
  }, 1500);
});

function semanaAMes(semana) {
  const sem = parseInt(semana, 10);
  if (sem >= 1 && sem <= 5) return 'Enero';
  else if (sem >= 6 && sem <= 9) return 'Febrero';
  else if (sem >= 10 && sem <= 13) return 'Marzo';
  else if (sem >= 14 && sem <= 17) return 'Abril';
  else if (sem >= 18 && sem <= 21) return 'Mayo';
  else if (sem >= 22 && sem <= 26) return 'Junio';
  else if (sem >= 27 && sem <= 30) return 'Julio';
  else if (sem >= 31 && sem <= 35) return 'Agosto';
  else if (sem >= 36 && sem <= 39) return 'Septiembre';
  else if (sem >= 40 && sem <= 43) return 'Octubre';
  else if (sem >= 44 && sem <= 47) return 'Noviembre';
  else if (sem >= 48 && sem <= 52) return 'Diciembre';
  else return 'Desconocido';
}

function generarResumen(hacienda) {
  const datosHacienda = fullData.filter(r =>
    r.Hacienda === hacienda &&
    r['Cajas'] !== undefined && r['Cajas'] !== ''
  );

  // Agrupar cajas por mes
  const cajasPorMes = {};
  datosHacienda.forEach(row => {
    const mes = semanaAMes(row.Semana);
    cajasPorMes[mes] = (cajasPorMes[mes] || 0) + (+row.Cajas || 0);
  });
  const ordenMeses = Object.entries(cajasPorMes).sort((a, b) => b[1] - a[1]);

  const mesMasProd = ordenMeses[0] || ['--', 0];
  const mesMenosProd = ordenMeses[ordenMeses.length - 1] || ['--', 0];

  document.getElementById("mesMasProductivo").textContent = `${mesMasProd[0]} ( ${mesMasProd[1].toLocaleString()} cajas )`;
  document.getElementById("mesMenosProductivo").textContent = `${mesMenosProd[0]} ( ${mesMenosProd[1].toLocaleString()} cajas )`;

  // Semanas más y menos productivas con cantidad
  const ordenSemanas = datosHacienda
    .map(row => ({ semana: row.Semana, cajas: +row.Cajas || 0 }))
    .sort((a, b) => b.cajas - a.cajas);

  const semanaMasProd = ordenSemanas[0] || { semana: '--', cajas: 0 };
  const semanaMenosProd = ordenSemanas[ordenSemanas.length - 1] || { semana: '--', cajas: 0 };

  document.getElementById("semanaMasProductiva").textContent = `${semanaMasProd.semana} ( ${semanaMasProd.cajas.toLocaleString()} cajas )`;
  document.getElementById("semanaMenosProductiva").textContent = `${semanaMenosProd.semana} ( ${semanaMenosProd.cajas.toLocaleString()} cajas )`;

  // Ranking general de fincas con estilos para destacar actual
  const cajasPorFinca = {};
  fullData.forEach(row => {
    if (!row.Cajas || row.Cajas === '') return;
    cajasPorFinca[row.Hacienda] = (cajasPorFinca[row.Hacienda] || 0) + (+row.Cajas || 0);
  });

  const ranking = Object.entries(cajasPorFinca)
    .sort((a, b) => b[1] - a[1]);

  const rankingList = document.getElementById("rankingFincas");
  rankingList.innerHTML = '';

  ranking.forEach(([finca, cajas]) => {
    const li = document.createElement('li');
    li.textContent = finca;
    li.style.color = (finca === hacienda) ? '#000000' : '#bbbbbb';
    li.style.fontWeight = (finca === hacienda) ? 'bold' : 'normal';
    rankingList.appendChild(li);
  });

  // Tendencia de la hacienda (subida o bajada)
  const cajasOrdenadas = datosHacienda
    .sort((a, b) => parseInt(a.Semana) - parseInt(b.Semana))
    .map(r => +r.Cajas || 0);

  const tendencia = cajasOrdenadas[0] < cajasOrdenadas[cajasOrdenadas.length - 1]
    ? 'TENDENCIA DE SUBIDA 📈'
    : 'TENDENCIA DE BAJADA 📉';
  document.getElementById("tendenciaHacienda").textContent = tendencia;
}

function createCharts() {
  racimosChart = new Chart(racimosCtx, {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 0, bottom: 0 }
      },
      plugins: {
        legend: { position: 'top' },
        datalabels: { anchor: 'end', align: 'right', color: 'black', font: { weight: 'bold', size: 12 } },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (context) {
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

  let categoryPercentage = 1, barPercentage = 0.8

  racimosChart.data.datasets = [
    {
      label: 'Racimos Cosechados', data: racimosCosechados, backgroundColor: 'rgba(200,200,200,0.6)',
      borderRadius: 8,
      categoryPercentage,
      barPercentage,
    },

    {
      label: 'Procesados', data: racimosProcesados, backgroundColor: 'rgba(100,200,100,0.6)',
      borderRadius: 8,
      categoryPercentage,
      barPercentage,
    },
    {
      label: 'Rechazados', data: racimosRechazados, backgroundColor: 'rgba(255,99,132,0.6)',
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
