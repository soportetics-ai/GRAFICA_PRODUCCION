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
let visibilidadRacimos = {};

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

const semanasEsperadasPorMes = {
  'Enero': 5,
  'Febrero': 4,
  'Marzo': 4,
  'Abril': 4,
  'Mayo': 4,
  'Junio': 5,
  'Julio': 4,
  'Agosto': 5,
  'Septiembre': 4,
  'Octubre': 4,
  'Noviembre': 4,
  'Diciembre': 5
};

function generarResumen(hacienda) {
  const datosHacienda = fullData.filter(r =>
    r.Hacienda === hacienda &&
    r['Cajas'] !== undefined && r['Cajas'] !== ''
  );

  // 🔧 AJUSTE: Agrupar por mes con conteo de semanas
  const cajasPorMes = {};
  const semanasPorMes = {};

  datosHacienda.forEach(row => {
    const mes = semanaAMes(row.Semana);
    const semana = row.Semana;

    cajasPorMes[mes] = (cajasPorMes[mes] || 0) + (+row.Cajas || 0);
    semanasPorMes[mes] = semanasPorMes[mes] || new Set();
    semanasPorMes[mes].add(semana);
  });

  // 🔧 AJUSTE: Filtrar solo meses completos
  const mesesCompletos = Object.entries(semanasPorMes)
    .filter(([mes, semanas]) => semanas.size >= semanasEsperadasPorMes[mes])
    .map(([mes]) => mes);

  const cajasMesesFiltrados = Object.fromEntries(
    Object.entries(cajasPorMes).filter(([mes]) => mesesCompletos.includes(mes))
  );

  const ordenMeses = Object.entries(cajasMesesFiltrados).sort((a, b) => b[1] - a[1]);

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

  // Paso 1: Hectáreas por finca
  const hectareasPorFinca = {
    "MARIA": 231.59,
    "PORVENIR": 93.11,
    "ESPERANZA": 36,
    "EL CISNE": 13,
    "VAQUERIA": 61.4,
    "ESTRELLITA": 16.65,
    "PRIMAVERA": 67,
    "AGRO&SOL": 378
  };

  // Paso 2: Número de semanas activas
  const semanasActivas = 32;

  // Paso 3: Calcular total de cajas por finca
  const cajasPorFinca = {};
  fullData.forEach(row => {
    if (!row.Cajas || row.Cajas === '') return;
    cajasPorFinca[row.Hacienda] = (cajasPorFinca[row.Hacienda] || 0) + (+row.Cajas || 0);
  });

  // Paso 4: Calcular promedio semanal redondeado
  const ranking = Object.entries(cajasPorFinca)
    .map(([finca, cajas]) => {
      const hectareas = hectareasPorFinca[finca] || 1;
      const promedioSemanal = Math.round((cajas / hectareas) / semanasActivas);
      return { finca, promedioSemanal };
    })
    .sort((a, b) => b.promedioSemanal - a.promedioSemanal);

  // Paso 5: Mostrar en el DOM
  const rankingList = document.getElementById("rankingFincas");
  rankingList.innerHTML = '';

  ranking.forEach(({ finca, promedioSemanal }) => {
    const li = document.createElement('li');
    li.textContent = `${finca} (${promedioSemanal}) caja x has semanales`;
    li.style.color = (finca === hacienda) ? '#000000' : '#bbbbbb';
    li.style.fontWeight = (finca === hacienda) ? 'bold' : 'normal';
    rankingList.appendChild(li);
  });

  const cajasOrdenadas = datosHacienda
    .sort((a, b) => parseInt(a.Semana) - parseInt(b.Semana))
    .map(r => +r.Cajas || 0);

  const tendencia = cajasOrdenadas[0] < cajasOrdenadas[cajasOrdenadas.length - 1]
    ? 'TENDENCIA DE SUBIDA 📈'
    : 'TENDENCIA DE BAJADA 📉';
  document.getElementById("tendenciaHacienda").textContent = tendencia;

  const datosRacimos = fullData.filter(r => r.Hacienda === hacienda);





     function generarResumenRacimosRechazados(semana = 'Todas') {
  const selectedHacienda = haciendaSelector.value;

  const haciendasUnicas = [...new Set(fullData
    .map(r => r.Hacienda)
    .filter(h => h && h.trim() !== ''))];

  const resumenRechazados = haciendasUnicas.map(hacienda => {
    let datosHacienda = fullData.filter(r => r.Hacienda === hacienda);

    if (semana !== 'Todas') {
      datosHacienda = datosHacienda.filter(r => r.Semana === semana);
    }

    const totalRechazados = datosHacienda.reduce((acc, cur) => acc + (+cur.Rechazados || 0), 0);
    const totalCosechados = datosHacienda.reduce((acc, cur) => acc + (+cur['Racimos Cosechados'] || 0), 0);
    const porcentaje = totalCosechados > 0 ? (totalRechazados / totalCosechados) * 100 : 0;

    return {
      hacienda,
      totalRechazados,
      porcentaje
    };
  });

  resumenRechazados.sort((a, b) => b.porcentaje - a.porcentaje);

  const ul = document.getElementById('listaRacimosRechazados');
  ul.innerHTML = '';

  resumenRechazados.forEach(({ hacienda, totalRechazados, porcentaje }, index) => {
    const li = document.createElement('li');
    li.textContent = `${hacienda}: ${totalRechazados.toLocaleString()} racimos rechazados (${porcentaje.toFixed(2)}%)`;

    if (hacienda === selectedHacienda) {
      li.style.color = '#000000';
      li.style.fontWeight = 'bold';
    } else {
      li.style.color = '#bbbbbb';
      li.style.fontWeight = 'normal';
    }

    li.style.fontSize = '14px';
    li.style.padding = '4px 0';

    ul.appendChild(li);
  });
}

document.getElementById('filtroSemanaRechazados').addEventListener('change', e => {
  generarResumenRacimosRechazados(e.target.value);
});


  llenarFiltroSemana();
 generarResumenRacimosRechazados();
}




function llenarFiltroSemana() {
  const select = document.getElementById('filtroSemanaRechazados');
  // Obtener semanas únicas válidas, filtrando null, undefined y vacíos
  const semanasUnicas = [...new Set(
    fullData
      .map(r => r.Semana)
      .filter(sem => sem !== null && sem !== undefined && sem.toString().trim() !== '')
  )].sort((a, b) => parseInt(a) - parseInt(b));

  // Limpiar opciones excepto "Todas"
  select.querySelectorAll('option:not([value="Todas"])').forEach(opt => opt.remove());

  // Agregar opciones
  semanasUnicas.forEach(sem => {
    const option = document.createElement('option');
    option.value = sem;
    option.textContent = `Semana ${sem}`;
    select.appendChild(option);
  });
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

  const datasetsRacimos = [
    {
      label: 'Racimos Cosechados',
      data: racimosCosechados,
      backgroundColor: 'rgba(200,200,200,0.6)',
      borderRadius: 8,
      categoryPercentage: 1,
      barPercentage: 0.8,
    },
    {
      label: 'Procesados',
      data: racimosProcesados,
      backgroundColor: 'rgba(100,200,100,0.6)',
      borderRadius: 8,
      categoryPercentage: 1,
      barPercentage: 0.8,
    },

      {
    label: 'Rechazados',
    data: racimosRechazados,
    backgroundColor: 'rgba(255,99,132,0.6)',
    borderRadius: 8,
    categoryPercentage: 1,
    barPercentage: 0.8,
    datalabels: {
      labels: {
        cantidad: {
          formatter: function(value) {
            return value;  // solo el número
          },
          anchor: 'end',
          align: 'right',
          color: 'black',
          font: { weight: 'bold', size: 12 }
        },
        porcentaje: {
          formatter: function(value, context) {
            const index = context.dataIndex;
            const totalCosechados = racimosCosechados[index] || 1;
            const porcentaje = ((value / totalCosechados) * 100).toFixed(2);
            return ` (${porcentaje}%)`;
          },
          anchor: 'end',
          align: 'right',
          color: 'rgba(0,0,0,0.5)',
          font: { weight: 'normal', size: 11},
          offset: 25
        }
      }
    }
  }
  ];

  datasetsRacimos.forEach((ds) => {
    ds.hidden = visibilidadRacimos[ds.label] || false;
  });

  racimosChart.data.datasets = datasetsRacimos;
  racimosChart.update();

  racimosChart.options.plugins.legend.onClick = function(e, legendItem, legend) {
    const index = legendItem.datasetIndex;
    const meta = racimosChart.getDatasetMeta(index);
    meta.hidden = !meta.hidden;
    visibilidadRacimos[legendItem.text] = meta.hidden;
    racimosChart.update();
  };

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
