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
    generarResumen(hacienda);}, 1500);
});

// PARAMETROS ( LYDAS )***********
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





// GENERA RESUMEN DE MES Y SEMANA MAS PRODUCTIVOS 📅📦***********
function generarResumen(hacienda, semana = 'Todas') {
  let datosHacienda = fullData.filter(r =>
    r.Hacienda === hacienda &&
    r['Cajas'] !== undefined &&
    r['Cajas'] !== '');
    if (semana !== 'Todas') {
    datosHacienda = datosHacienda.filter(r => r.Semana === semana);}
  const totalCajasGlobalAll = fullData.reduce((acc, r) => acc + (+r.Cajas || 0), 0);
  const totalCajasFiltro = (semana === 'Todas')
  ? totalCajasGlobalAll  : fullData.filter(r => r.Semana === semana).reduce((acc, r) => acc + (+r.Cajas || 0), 0);
  const elGlobal = document.getElementById('totalCajasGlobal');
    if (elGlobal) elGlobal.textContent = totalCajasGlobalAll.toLocaleString();
  const elSemana = document.getElementById('totalCajasSemana');
    if (elSemana) elSemana.textContent = totalCajasFiltro.toLocaleString();
  const cajasPorMes = {};
  const semanasPorMes = {};
  datosHacienda.forEach(row => {
    const mes = semanaAMes(row.Semana);
    const semanaRow = row.Semana;
    cajasPorMes[mes] = (cajasPorMes[mes] || 0) + (+row.Cajas || 0);
    semanasPorMes[mes] = semanasPorMes[mes] || new Set();
    semanasPorMes[mes].add(semanaRow);});  
  const mesesCompletos = Object.entries(semanasPorMes)
    .filter(([mes, semanas]) => semanas.size >= semanasEsperadasPorMes[mes])
    .map(([mes]) => mes);
  const cajasMesesFiltrados = Object.fromEntries(
    Object.entries(cajasPorMes).filter(([mes]) => mesesCompletos.includes(mes)));
  const ordenMeses = Object.entries(cajasMesesFiltrados).sort((a, b) => b[1] - a[1]);
  const mesMasProd = ordenMeses[0] || ['--', 0];
  const mesMenosProd = ordenMeses[ordenMeses.length - 1] || ['--', 0];
  document.getElementById("mesMasProductivo").textContent = `${mesMasProd[0]} ( ${mesMasProd[1].toLocaleString()} cajas )`;
  document.getElementById("mesMenosProductivo").textContent = `${mesMenosProd[0]} ( ${mesMenosProd[1].toLocaleString()} cajas )`;
  const ordenSemanas = datosHacienda
    .map(row => ({ semana: row.Semana, cajas: +row.Cajas || 0 }))
    .sort((a, b) => b.cajas - a.cajas);
  const semanaMasProd = ordenSemanas[0] || { semana: '--', cajas: 0 };
  const semanaMenosProd = ordenSemanas[ordenSemanas.length - 1] || { semana: '--', cajas: 0 };
  document.getElementById("semanaMasProductiva").textContent = `${semanaMasProd.semana} ( ${semanaMasProd.cajas.toLocaleString()} cajas )`;
  document.getElementById("semanaMenosProductiva").textContent = `${semanaMenosProd.semana} ( ${semanaMenosProd.cajas.toLocaleString()} cajas )`;




  // GENERA RESUMEN DE TENDECIA ULTIMA (-) PENULTIMA CAJA***********
  const cajasOrdenadas = datosHacienda
  .sort((a, b) => parseInt(a.Semana) - parseInt(b.Semana))
  .map(r => +r.Cajas || 0);
const len = cajasOrdenadas.length;
if (len >= 2) {
  const penultima = cajasOrdenadas[len - 2];
  const ultima = cajasOrdenadas[len - 1];
  const tendencia = penultima < ultima
    ? 'TENDENCIA DE SUBIDA 📈'
    : 'TENDENCIA DE BAJADA 📉';
  document.getElementById("tendenciaHacienda").textContent = tendencia;} else {
  document.getElementById("tendenciaHacienda").textContent = 'Datos insuficientes para tendencia';}







// GENERA RESUMEN DE POSICION 🏆***********  
  function generarResumenPosicion(semana = 'Todas') {
  const selectedHacienda = haciendaSelector.value;
  const haciendasUnicas = [...new Set(fullData.map(r => r.Hacienda).filter(h => h && h.trim() !== ''))];
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
  const resumenPosicion = haciendasUnicas.map(hacienda => {
    let datosHacienda = fullData.filter(r => r.Hacienda === hacienda);
    if (semana !== 'Todas') {
      datosHacienda = datosHacienda.filter(r => r.Semana === semana);}
    const totalCajas = datosHacienda.reduce((acc, cur) => acc + (+cur.Cajas || 0), 0);
    const semanasActivasSet = new Set(datosHacienda.map(r => r.Semana));
    const semanasActivas = semanasActivasSet.size || 1;
    const hectareas = hectareasPorFinca[hacienda] || 1;
    const divisorSemanas = (semana === 'Todas') ? semanasActivas : 1;
    const promedioSemanal = ((totalCajas / hectareas) / divisorSemanas).toFixed(2);
    return { hacienda, promedioSemanal };});
  resumenPosicion.sort((a, b) => b.promedioSemanal - a.promedioSemanal);
  const rankingList = document.getElementById("rankingFincas");
  rankingList.innerHTML = '';
  resumenPosicion.forEach(({ hacienda, promedioSemanal }) => {
    const li = document.createElement('li');
    li.textContent = `${hacienda} (${promedioSemanal}) caja x has semanales`;
    if (hacienda === selectedHacienda) {li.style.color = '#000000';li.style.fontWeight = 'bold';
    } else {
    li.style.color = '#bbbbbb';li.style.fontWeight = 'normal';
    }
    li.style.fontSize = '14px';li.style.padding = '4px 0';
    rankingList.appendChild(li);
  });}
document.getElementById('filtroSemanaPosicion').addEventListener('change', e => {generarResumenPosicion(e.target.value);
});
function llenarFiltroSemanaPosicion() {
  const select = document.getElementById('filtroSemanaPosicion');
  const semanasUnicas = [...new Set(
    fullData
      .map(r => r.Semana)
      .filter(sem => sem !== null && sem !== undefined && sem.toString().trim() !== '')
  )].sort((a, b) => parseInt(a) - parseInt(b));
  select.querySelectorAll('option:not([value="Todas"])').forEach(opt => opt.remove());
  semanasUnicas.forEach(sem => {
    const option = document.createElement('option');
    option.value = sem;
    option.textContent = `Semana ${sem}`;
    select.appendChild(option);
  });}
llenarFiltroSemanaPosicion();
generarResumenPosicion('Todas');

// 🌪️ FILTRO PARA POSICION*********** 
function llenarFiltroSemanaPosicion() {
  const select = document.getElementById('filtroSemanaPosicion');
  const semanasUnicas = [...new Set(
    fullData.map(r => r.Semana).filter(sem => sem !== null && sem !== undefined && sem.toString().trim() !== ''))].sort((a,b) => parseInt(a) - parseInt(b));
  select.querySelectorAll('option:not([value="Todas"])').forEach(opt => opt.remove());
  semanasUnicas.forEach(sem => {
    const option = document.createElement('option');
    option.value = sem;
    option.textContent = `Semana ${sem}`;
    select.appendChild(option);
  });
}





 


// GENERA RESUMEN DE REHAZOS 🚯***********
  function generarResumenRacimosRechazados(semana = 'Todas') {
    const selectedHacienda = haciendaSelector.value;
    const haciendasUnicas = [...new Set(fullData.map(r => r.Hacienda).filter(h => h && h.trim() !== ''))];
    const resumenRechazados = haciendasUnicas.map(hacienda => {
      let datosHacienda = fullData.filter(r => r.Hacienda === hacienda);
          if (semana !== 'Todas') {
      datosHacienda = datosHacienda.filter(r => r.Semana === semana);}
    const totalRechazados = datosHacienda.reduce((acc, cur) => acc + (+cur.Rechazados || 0), 0);
    const totalCosechados = datosHacienda.reduce((acc, cur) => acc + (+cur['Racimos Cosechados'] || 0), 0);
    const porcentaje = totalCosechados > 0 ? (totalRechazados / totalCosechados) * 100 : 0;
    return {hacienda,totalRechazados,porcentaje};});
  resumenRechazados.sort((a, b) => b.porcentaje - a.porcentaje);
  const ul = document.getElementById('listaRacimosRechazados');
  ul.innerHTML = '';
  resumenRechazados.forEach(({ hacienda, totalRechazados, porcentaje }, index) => {
    const li = document.createElement('li');
    li.textContent = `${hacienda}: ${totalRechazados.toLocaleString()} racimos rechazados (${porcentaje.toFixed(2)}%)`;
    if (hacienda === selectedHacienda) {
      li.style.color = '#000000';li.style.fontWeight = 'bold';} else {li.style.color = '#bbbbbb';li.style.fontWeight = 'normal'; }li.style.fontSize = '14px';li.style.padding = '4px 0';ul.appendChild(li);
  });}
  document.
  getElementById('filtroSemanaRechazados').addEventListener('change', e => {
  generarResumenRacimosRechazados(e.target.value);});
  llenarFiltroSemana();
  generarResumenRacimosRechazados();}

// 🌪️ FILTRO PARA RECHASOS***********   
function llenarFiltroSemana() {
  const select = document.getElementById('filtroSemanaRechazados');
  const semanasUnicas = [...new Set(
    fullData.map(r => r.Semana).filter(sem => sem !== null && sem !== undefined && sem.toString().trim() !== ''))].sort((a, b) => parseInt(a) - parseInt(b));
  select.querySelectorAll('option:not([value="Todas"])').forEach(opt => opt.remove());
  semanasUnicas.forEach(sem => {
    const option = document.createElement('option');
    option.value = sem;
    option.textContent = `Semana ${sem}`;
  select.appendChild(option);
  });
}













// 📊📊📊📊📊📊 SCRIPT CHART ( GRAFICO DE BARRAS ) 📊📊📊📊📊📊📊
function createCharts() {
  racimosChart = new Chart(racimosCtx, {type: 'bar',data: { labels: [], datasets: [] },options: {indexAxis: 'y',responsive: true,maintainAspectRatio: false,layout: {padding: { top: 0, bottom: 0 }},
      plugins: {
        legend: { position: 'top' },datalabels: { anchor: 'end', align: 'right', color: 'black', font: { weight: 'bold', size: 12 } },



      tooltip: {
        enabled: false,
        external: function (context) {
          let tooltipEl = document.getElementById('chartjs-tooltip');

          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip';
            tooltipEl.style.background = 'rgba(0, 0, 0, 0.81)';
            tooltipEl.style.color = 'white';
            tooltipEl.style.borderRadius = '3px';
            tooltipEl.style.padding = '8px';
            tooltipEl.style.position = 'absolute';
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.transition = 'all .1s ease';
            tooltipEl.style.fontSize = '12px';
            tooltipEl.style.fontFamily = 'Arial, sans-serif';
            document.body.appendChild(tooltipEl);
          }

          const tooltipModel = context.tooltip;
          if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = 0;
            return;
          }

          const canvasRect = context.chart.canvas.getBoundingClientRect();

          let left = canvasRect.left + window.pageXOffset + tooltipModel.caretX;
          let top = canvasRect.top + window.pageYOffset + tooltipModel.caretY;

          tooltipEl.style.opacity = 1;
          tooltipEl.style.left = '0px'; 
          tooltipEl.style.top = '0px';  
          tooltipEl.innerHTML = '';  

          const dataIndex = tooltipModel.dataPoints[0].dataIndex;
          const datasetLabel = tooltipModel.dataPoints[0].dataset.label;
          const value = tooltipModel.dataPoints[0].parsed.x;
          const semana = context.chart.data.labels[dataIndex];
          const hacienda = haciendaSelector.value;

          const container = document.createElement('div');

          if (datasetLabel === 'Rechazados') {
            const filasCausas = fullData.filter(r =>
              r.Hacienda === hacienda &&
              r.Semana === semana &&
              (!r['Racimos Cosechados'] || r['Racimos Cosechados'] === '')
            );
            const totalRechazosSemana = fullData
              .filter(r => r.Hacienda === hacienda && r.Semana === semana)
              .reduce((acc, cur) => acc + (+cur['Rechazados'] || 0), 0) || 1;

            const mainLine = document.createElement('div');
            mainLine.style.display = 'flex';
            mainLine.style.alignItems = 'center';
            mainLine.style.fontWeight = 'bold';
            mainLine.style.color = '#ffc0c0ff';
            mainLine.style.marginBottom = '6px';

            const colorBox = document.createElement('span');
            colorBox.style.display = 'inline-block';
            colorBox.style.width = '12px';
            colorBox.style.height = '12px';
            colorBox.style.backgroundColor = 'rgba(255, 99, 132, 0.6)';
            colorBox.style.marginRight = '8px';
            colorBox.style.borderRadius = '2px';

            mainLine.appendChild(colorBox);
            mainLine.appendChild(document.createTextNode(`${datasetLabel}: ${value}`));
            container.appendChild(mainLine);

            if (filasCausas.length > 0) {
              const todasLasClaves = Object.keys(filasCausas[0]);
              const causasPosibles = todasLasClaves.filter(k =>
                !['Semana', 'Hacienda', 'Racimos Cosechados', 'Procesados', 'Rechazados', 'Cajas', 'Rathio'].includes(k)
              );
              const sumaPorCausa = {};
              for (const fila of filasCausas) {
                for (const causa of causasPosibles) {
                  const val = +fila[causa] || 0;
                  if (val > 0) {
                    sumaPorCausa[causa] = (sumaPorCausa[causa] || 0) + val;
                  }
                }
              }
              const ordenado = Object.entries(sumaPorCausa).sort((a, b) => b[1] - a[1]);

              ordenado.forEach(([nombre, val]) => {
                const porcentaje = ((val / totalRechazosSemana) * 100).toFixed(2);

                const causaLine = document.createElement('div');
                causaLine.style.fontWeight = 'bold';
                causaLine.style.color = '#ffffff';
                causaLine.style.marginBottom = '3px';

                causaLine.textContent = `${nombre}: ${val} `;

                const porcentajeSpan = document.createElement('span');
                porcentajeSpan.style.fontWeight = 'normal';
                porcentajeSpan.style.color = '#a5a5a5ff';
                porcentajeSpan.textContent = `(${porcentaje}%)`;

                causaLine.appendChild(porcentajeSpan);
                container.appendChild(causaLine);
              });
            }
          } else {
            container.textContent = `${datasetLabel}: ${value}`;
            container.style.color = '#ffffff';
            container.style.fontWeight = 'bold';
          }

          tooltipEl.appendChild(container);

          const tooltipRect = tooltipEl.getBoundingClientRect();
          const padding = 10;

          if (left + tooltipRect.width + padding > window.pageXOffset + window.innerWidth) {
            left = window.pageXOffset + window.innerWidth - tooltipRect.width - padding;
          }
          if (top + tooltipRect.height + padding > window.pageYOffset + window.innerHeight) {
            top = top - tooltipRect.height - padding;
            if (top < window.pageYOffset) top = window.pageYOffset + padding;
          }
          if (left < window.pageXOffset + padding) {
            left = window.pageXOffset + padding;
          }
          if (top < window.pageYOffset + padding) {
            top = window.pageYOffset + padding;
          }

          tooltipEl.style.left = left + 'px';
          tooltipEl.style.top = top + 'px';
        }
      }
    },
    
      scales: {
        x: {
          beginAtZero: true,
          categoryPercentage: 3.0,
          barPercentage: 3.8,
        }}},
    plugins: [ChartDataLabels]});

  cajasChart = new Chart(cajasCtx, {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        datalabels: { anchor: 'end',align: 'right',color: 'black',font: { weight: 'bold' }}
      },
      scales: { x: { beginAtZero: true } }},
    plugins: [ChartDataLabels]});
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
            return value;
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
        }}}}];

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

document.addEventListener('DOMContentLoaded', () => {
  resumenSection.style.display = 'none';
  const tabInicial = 'racimos';
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === tabInicial);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = (content.id === tabInicial) ? 'block' : 'none';
  });
});