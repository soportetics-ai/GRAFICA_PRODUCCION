const apiUrl = 'https://api.sheetbest.com/sheets/1655a791-4d3c-412f-961e-c2d306e7ea4b';
const apiResumenUrl = 'https://api.sheetbest.com/sheets/7e12e770-3dc8-4f6f-adec-179259dfc410';
const haciendaSelector = document.getElementById('haciendaSelector');
const resumenBtn = document.getElementById('resumenBtn');
const resumenSection = document.getElementById('resumenSection');
const nombreHaciendaResumen = document.getElementById('nombreHaciendaResumen');
const racimosCtx = document.getElementById('racimosChart').getContext('2d');
const cajasCtx = document.getElementById('cajasChart').getContext('2d');
let racimosChart, cajasChart; let fullData = []; let visibilidadRacimos = {}; let datosCosechados = []; function cargarCosechados() {

  fetch(apiResumenUrl).then(res => res.json()).then(data => { datosCosechados = Array.isArray(data) ? data : []; }).catch(err => { console.error("Error cargando datos de racimos cosechados:", err); datosCosechados = []; });
}
resumenBtn.addEventListener('click', () => {
  const hacienda = haciendaSelector.value;
  const magicLoader = document.getElementById('magic-loader');
  if (magicLoader) magicLoader.classList.remove('hidden');
  setTimeout(() => {
    if (magicLoader) magicLoader.classList.add('hidden');
    const tooltipEl = document.getElementById('chartjs-tooltip');
    if (tooltipEl) { tooltipEl.style.opacity = 0; tooltipEl.style.left = '-9999px'; tooltipEl.style.top = '-9999px'; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    nombreHaciendaResumen.textContent = hacienda;
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    resumenSection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    generarResumen(hacienda);
  }, 1500);
});;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  

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
  'Enero': 5, 'Febrero': 4, 'Marzo': 4, 'Abril': 4, 'Mayo': 4, 'Junio': 5, 'Julio': 4, 'Agosto': 5, 'Septiembre': 4, 'Octubre': 4, 'Noviembre': 4, 'Diciembre': 5
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  

// EFECTO SLIDER TABS ( RACIMOS |  CAJAS )***********
const tabs = document.querySelectorAll('.tabs .tab');
let slider = document.querySelector('.tab-slider');
if (!slider) {
  slider = document.createElement('div');
  slider.classList.add('tab-slider');
  document.querySelector('.tabs').appendChild(slider);}
slider.style.transform = `translateX(0%)`;
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    document.querySelector('.tabs .tab.active').classList.remove('active');
    tab.classList.add('active');
    slider.style.transform = `translateX(${index * 100}%)`;
  });
});




const selector = document.getElementById('haciendaSelector');
const logo = document.getElementById('logoFinca');

selector.addEventListener('change', () => {
  if (selector.value === 'AGRO&SOL' || selector.value === 'MARIA') {
    logo.src = 'img/logokra.png';
  } else {
    logo.src = 'img/logotec.png';
  }
});




// GENERA RESUMEN DE MES Y SEMANA MAS PRODUCTIVOS 📅📦***********
function generarResumen(hacienda, semana = 'Todas') {
  let datosHacienda = fullData.filter(r => r.Hacienda === hacienda && r['Cajas'] !== undefined && r['Cajas'] !== '');
  if (semana !== 'Todas') {
    datosHacienda = datosHacienda.filter(r => r.Semana === semana);
  }
  const totalCajasGlobalAll = fullData.reduce((acc, r) => acc + (+r.Cajas || 0), 0);
  const totalCajasFiltro = (semana === 'Todas')
    ? totalCajasGlobalAll : fullData.filter(r => r.Semana === semana).reduce((acc, r) => acc + (+r.Cajas || 0), 0);
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
    semanasPorMes[mes].add(semanaRow);
  });
  const mesesCompletos = Object.entries(semanasPorMes)
    .filter(([mes, semanas]) => semanas.size >= semanasEsperadasPorMes[mes]).map(([mes]) => mes);
  const cajasMesesFiltrados = Object.fromEntries(
    Object.entries(cajasPorMes).filter(([mes]) => mesesCompletos.includes(mes)));
  const ordenMeses = Object.entries(cajasMesesFiltrados).sort((a, b) => b[1] - a[1]);
  const mesMasProd = ordenMeses[0] || ['--', 0];
  const mesMenosProd = ordenMeses[ordenMeses.length - 1] || ['--', 0];
  document.getElementById("mesMasProductivo").textContent = `${mesMasProd[0]} ( ${mesMasProd[1].toLocaleString()} cajas )`;
  document.getElementById("mesMenosProductivo").textContent = `${mesMenosProd[0]} ( ${mesMenosProd[1].toLocaleString()} cajas )`;
  const ordenSemanas = datosHacienda
    .map(row => ({ semana: row.Semana, cajas: +row.Cajas || 0 })).sort((a, b) => b.cajas - a.cajas);
  const semanaMasProd = ordenSemanas[0] || { semana: '--', cajas: 0 };
  const semanaMenosProd = ordenSemanas[ordenSemanas.length - 1] || { semana: '--', cajas: 0 };
  document.getElementById("semanaMasProductiva").textContent = `${semanaMasProd.semana} ( ${semanaMasProd.cajas.toLocaleString()} cajas )`;
  document.getElementById("semanaMenosProductiva").textContent = `${semanaMenosProd.semana} ( ${semanaMenosProd.cajas.toLocaleString()} cajas )`;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  


  // GENERA RESUMEN DE TENDECIA 📈 ULTIMA (-) PENULTIMA CAJA***********
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
    document.getElementById("tendenciaHacienda").textContent = tendencia;
  } else {
    document.getElementById("tendenciaHacienda").textContent = 'Datos insuficientes para tendencia';
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  


  // 𝄜 GENERA TABLA CONSOLIDADA DE CAJAS GLOBALES***********
  function generarResumenCajas(semana = 'Todas') {
    const selectedHacienda = haciendaSelector.value;
    const haciendasUnicas = [...new Set(fullData.map(r => r.Hacienda).filter(h => h && h.trim() !== ''))];
    const resumenCajas = haciendasUnicas.map(hacienda => {
      let datosHacienda = fullData.filter(r => r.Hacienda === hacienda);
      if (semana !== 'Todas')
        datosHacienda = datosHacienda.filter(r => r.Semana === semana);
  
      const totalCajas = datosHacienda.reduce((acc, cur) => acc + (+cur['Cajas'] || 0), 0);
      return { hacienda, totalCajas };
    });
    resumenCajas.sort((a, b) => b.totalCajas - a.totalCajas);
    const ol = document.getElementById('cajasFincas'); ol.innerHTML = '';
    resumenCajas.forEach(({ hacienda, totalCajas }) => {
      const li = document.createElement('li');
      li.textContent = `${hacienda}: ${totalCajas.toLocaleString()}`;
      li.classList.toggle('selected-hacienda', hacienda === selectedHacienda);
      ol.appendChild(li);
    });
    const produccionElOro = resumenCajas
      .filter(r => r.hacienda !== 'AGRO&SOL')
      .reduce((acc, cur) => acc + cur.totalCajas, 0);
    const produccionPeninsula = resumenCajas
      .filter(r => r.hacienda === 'AGRO&SOL')
      .reduce((acc, cur) => acc + cur.totalCajas, 0);
    const produccionGlobal = produccionElOro + produccionPeninsula;
    document.getElementById('cajasElOro').textContent = `${produccionElOro.toLocaleString()} cajas`;
    document.getElementById('cajasPeninsula').textContent = `${produccionPeninsula.toLocaleString()} cajas`;
    document.getElementById('cajasGlobal').textContent = `${produccionGlobal.toLocaleString()} cajas`;
    
  }
  document.getElementById('filtroSemanaCajas').addEventListener('change', e => {
    generarResumenCajas(e.target.value);
  });
  function llenarFiltroSemanaCajas() {
    const select = document.getElementById('filtroSemanaCajas');
    const semanasUnicas = [...new Set(
      fullData.map(r => r.Semana).filter(sem => sem !== null && sem !== undefined && sem.toString().trim() !== ''))].sort((a, b) => parseInt(a) - parseInt(b));
    select.querySelectorAll('option:not([value="Todas"])').forEach(opt => opt.remove());
    semanasUnicas.forEach(sem => {
      const option = document.createElement('option');
      option.value = sem;
      option.textContent = `Semana ${sem}`;
      select.
        appendChild(option);
    });
  }
  llenarFiltroSemanaCajas();
  generarResumenCajas();

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  


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
      "AGRO&SOL": 378 };
    const resumenPosicion = haciendasUnicas.map(hacienda => {
      let datosHacienda = fullData.filter(r => r.Hacienda === hacienda);
      if (semana !== 'Todas') {
        datosHacienda = datosHacienda.filter(r => r.Semana === semana);
      }
      const totalCajas = datosHacienda.reduce((acc, cur) => acc + (+cur.Cajas || 0), 0);
      const semanasActivasSet = new Set(datosHacienda.map(r => r.Semana));
      const semanasActivas = semanasActivasSet.size || 1;
      const hectareas = hectareasPorFinca[hacienda] || 1;
      const divisorSemanas = (semana === 'Todas') ? semanasActivas : 1;
      const promedioSemanal = ((totalCajas / hectareas) / divisorSemanas).toFixed(0);
      return { hacienda, promedioSemanal };
    });
    resumenPosicion.sort((a, b) => b.promedioSemanal - a.promedioSemanal);
    const rankingList = document.getElementById("rankingFincas");
    rankingList.innerHTML = '';
    resumenPosicion.forEach(({ hacienda, promedioSemanal }) => {
      const li = document.createElement('li'); li.textContent = `${hacienda} (${promedioSemanal}) caja x has semanales`;
      if (hacienda === selectedHacienda) { li.style.color = '#000000'; li.style.fontWeight = 'bold'; } else { li.style.color = '#bbbbbb'; li.style.fontWeight = 'normal'; }
      li.style.fontSize = '14px'; li.style.padding = '4px 0'; rankingList.appendChild(li);
    });
  }
  document.getElementById('filtroSemanaPosicion').addEventListener('change', e => { generarResumenPosicion(e.target.value); });
  function llenarFiltroSemanaPosicion() {
    const select = document.getElementById('filtroSemanaPosicion');
    const semanasUnicas = [...new Set(fullData.map(r => r.Semana).filter(sem => sem !== null && sem !== undefined && sem.toString().trim() !== ''))].sort((a, b) => parseInt(a) - parseInt(b));
    select.querySelectorAll('option:not([value="Todas"])').forEach(opt => opt.remove());
    semanasUnicas.forEach(sem => {
      const option = document.createElement('option'); option.value = sem; option.textContent = `Semana ${sem}`; select.appendChild(option);
    });
  }
  llenarFiltroSemanaPosicion();
  generarResumenPosicion('Todas');

  // 🌪️ FILTRO PARA POSICION*********** 
  function llenarFiltroSemanaPosicion() {
    const select = document.getElementById('filtroSemanaPosicion');
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

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  


  // GENERA RESUMEN DE REHAZOS 🚯***********
  function generarResumenRacimosRechazados(semana = 'Todas') {
    const selectedHacienda = haciendaSelector.value;
    const haciendasUnicas = [...new Set(fullData.map(r => r.Hacienda).filter(h => h && h.trim() !== ''))];
    const resumenRechazados = haciendasUnicas.map(hacienda => {
      let datosHacienda = fullData.filter(r => r.Hacienda === hacienda);
      if (semana !== 'Todas') {
        datosHacienda = datosHacienda.filter(r => r.Semana === semana);
      }
      const totalRechazados = datosHacienda.reduce((acc, cur) => acc + (+cur.Rechazados || 0), 0);
      const totalCosechados = datosHacienda.reduce((acc, cur) => acc + (+cur['Racimos Cosechados'] || 0), 0);
      const porcentaje = totalCosechados > 0 ? (totalRechazados / totalCosechados) * 100 : 0;
      return { hacienda, totalRechazados, porcentaje };
    });
    resumenRechazados.sort((a, b) => b.porcentaje - a.porcentaje);
    const ul = document.getElementById('listaRacimosRechazados'); ul.innerHTML = '';
    resumenRechazados.forEach(({ hacienda, totalRechazados, porcentaje }, index) => {
      const li = document.createElement('li'); li.textContent = `${hacienda}: ${totalRechazados.toLocaleString()} racimos rechazados (${porcentaje.toFixed(2)}%)`;
      if (hacienda === selectedHacienda) {
        li.style.color = '#000000'; li.style.fontWeight = 'bold';
      } else { li.style.color = '#bbbbbb'; li.style.fontWeight = 'normal'; } li.style.fontSize = '14px'; li.style.padding = '4px 0'; ul.appendChild(li);
    });
  }
  document.
    getElementById('filtroSemanaRechazados').addEventListener('change', e => {
      generarResumenRacimosRechazados(e.target.value);
    });
  llenarFiltroSemana();
  generarResumenRacimosRechazados();
}

// 🌪️ FILTRO PARA RECHASOS***********   
function llenarFiltroSemana() {
  const select = document.getElementById('filtroSemanaRechazados');
  const semanasUnicas = [...new Set(fullData.map(r => r.Semana).filter(sem => sem !== null && sem !== undefined && sem.toString().trim() !== ''))].sort((a, b) => parseInt(a) - parseInt(b));
  select.querySelectorAll('option:not([value="Todas"])').forEach(opt => opt.remove());
  semanasUnicas.forEach(sem => {
    const option = document.createElement('option'); option.value = sem; option.textContent = `Semana ${sem}`; select.appendChild(option);
  });
}



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  




// 📊📊📊📊📊📊 SCRIPT CHART ( GRAFICO DE BARRAS ) 📊📊📊📊📊📊📊
function createCharts() {
  racimosChart = new Chart(racimosCtx, {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 0, bottom: 0 } },
      plugins: {
        legend: { position: 'top' },
        datalabels: { anchor: 'end', align: 'right', color: 'black', font: { weight: 'bold', size: 12 } },
        tooltip: {
          enabled: false,
          external: function (context) {
            let tooltipEl = document.getElementById('chartjs-tooltip');
            if (!tooltipEl) {
              tooltipEl = document.createElement('div');
              tooltipEl.id = 'chartjs-tooltip';
              tooltipEl.classList.add('chartjs-tooltip');
              document.body.appendChild(tooltipEl);
            }
            const tooltipModel = context.tooltip;
            if (tooltipModel.opacity === 0) {
              tooltipEl.style.opacity = 0; return;
            }

            const canvasRect = context.chart.canvas.getBoundingClientRect();
            let left = canvasRect.left + window.pageXOffset + tooltipModel.caretX;
            let top = canvasRect.top + window.pageYOffset + tooltipModel.caretY;
            tooltipEl.style.opacity = 1;
            tooltipEl.style.left = '0px';
            tooltipEl.style.top = '0px';
            tooltipEl.innerHTML = '';

            const dataIndex = tooltipModel.dataPoints[0].dataIndex;
            let datasetLabel = tooltipModel.dataPoints[0].dataset.label;
            const value = tooltipModel.dataPoints[0].parsed.x;
            const semana = context.chart.data.labels[dataIndex];
            const hacienda = haciendaSelector.value.toUpperCase();
            const container = document.createElement('div');

            // ===== Ajuste para CACAO: cambio de nombres en tabs y leyenda =====
            if (hacienda === 'CACAO') {
              // Cambios de leyenda
              if (datasetLabel === 'Racimos Cosechados') datasetLabel = 'Quintales Cosechados';
              if (datasetLabel === 'Procesados') datasetLabel = 'Vendidos';
              if (datasetLabel === 'Rechazados') datasetLabel = 'Fallo';

              // Cambiar nombres de tabs visibles
              document.querySelector('.tab[data-tab="racimos"]').textContent = 'QUINTALES 🍌';
            } else {
              // Restaurar nombres por defecto si no es CACAO
              document.querySelector('.tab[data-tab="racimos"]').textContent = 'RACIMOS 🍌';
            }

            if (datasetLabel === 'Fallo') {
              const filasCausas = fullData.filter(r =>
                r.Hacienda.toUpperCase() === hacienda && r.Semana === semana &&
                (!r['Racimos Cosechados'] || r['Racimos Cosechados'] === '')
              );
              const totalRechazosSemana = fullData
                .filter(r => r.Hacienda.toUpperCase() === hacienda && r.Semana === semana)
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
                    if (val > 0) sumaPorCausa[causa] = (sumaPorCausa[causa] || 0) + val;
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
              // ===== Tooltip normal o CACAO con imagen =====
              const mainLine = document.createElement('div');
              mainLine.style.display = 'flex';
              mainLine.style.alignItems = 'center';
              mainLine.style.fontWeight = 'bold';
              mainLine.style.color = '#ffffff';
              mainLine.style.marginBottom = '6px';

              const colorBox = document.createElement('span');
              colorBox.style.display = 'inline-block';
              colorBox.style.width = '12px';
              colorBox.style.height = '12px';
              colorBox.style.backgroundColor = 'rgba(200,200,200,0.8)';
              colorBox.style.marginRight = '8px';
              colorBox.style.borderRadius = '2px';

              mainLine.appendChild(colorBox);
              mainLine.appendChild(document.createTextNode(`${datasetLabel}: ${value}`));
              container.appendChild(mainLine);

              if (hacienda === 'CACAO') {
                const img = document.createElement('img');
                img.src = 'img/tuimagen.jpeg';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                img.style.display = 'block';
                container.appendChild(img);

                container.style.width = '400px';
                container.style.height = '500px';
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.justifyContent = 'center';
                container.style.alignItems = 'center';
                container.style.whiteSpace = 'normal';
                container.style.overflow = 'hidden';
              }
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
            if (left < window.pageXOffset + padding) left = window.pageXOffset + padding;
            if (top < window.pageYOffset + padding) top = window.pageYOffset + padding;

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
        }
      }
    },
    plugins: [ChartDataLabels]
  });

  // ===== CAJAS =====
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
          color: function (context) {
            if (context.dataset.label === 'RATHIO') {
              return document.body.classList.contains('dark-mode') ? '#ffe066' : '#b8860b';
            }
            return document.body.classList.contains('dark-mode') ? '#f5f5f5' : 'black';
          },
          font: { weight: 'bold' }
        }
      },
      scales: { x: { beginAtZero: true } }
    },
    plugins: [ChartDataLabels]
  });
}

// ===================== UPDATE CHARTS COMPLETO =====================
function updateCharts(data) {
  const semanas = data.map(row => row.Semana);
  const hacienda = haciendaSelector.value.toUpperCase();

  racimosChart.data.labels = semanas;

  let racimosCosechados = data.map(row => +row['Racimos Cosechados'] || 0);
  let racimosProcesados = data.map(row => +row['Procesados'] || 0);
  let racimosRechazados = data.map(row => +row['Rechazados'] || 0);

  // Ajuste de nombres si es CACAO
  let labelCosechados = 'Racimos Cosechados';
  let labelProcesados = 'Procesados';
  let labelRechazados = 'Rechazados';
  if (hacienda === 'CACAO') {
    labelCosechados = 'Quintales Cosechados';
    labelProcesados = 'Vendidos';
    labelRechazados = 'Fallo';
  }

  const datasetsRacimos = [
    { label: labelCosechados, data: racimosCosechados, backgroundColor: 'rgba(200,200,200,0.6)', borderRadius: 8, categoryPercentage: 1, barPercentage: 0.8 },
    { label: labelProcesados, data: racimosProcesados, backgroundColor: 'rgba(100,200,100,0.6)', borderRadius: 8, categoryPercentage: 1, barPercentage: 0.8 },
    { label: labelRechazados, data: racimosRechazados, backgroundColor: 'rgba(255,99,132,0.6)', borderRadius: 8, categoryPercentage: 1, barPercentage: 0.8 }
  ];

  datasetsRacimos.forEach(ds => {
    ds.hidden = visibilidadRacimos[ds.label] || false;
  });

  racimosChart.data.datasets = datasetsRacimos;
  racimosChart.update();

  racimosChart.options.plugins.legend.onClick = function (e, legendItem, legend) {
    const index = legendItem.datasetIndex;
    const meta = racimosChart.getDatasetMeta(index);
    meta.hidden = !meta.hidden;
    visibilidadRacimos[legendItem.text] = meta.hidden;
    racimosChart.update();
  };

  // ===== CAJAS =====
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
    const tooltipEl = document.getElementById('chartjs-tooltip');
    if (tooltipEl) {
      tooltipEl.style.opacity = 0;
      tooltipEl.style.left = '-9999px';
      tooltipEl.style.top = '-9999px';
    }
    resumenSection.style.display = 'none';
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

    tab.classList.add('active');
    const targetId = tab.getAttribute('data-tab');
    document.getElementById(targetId).style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

function fetchAndRender() {
  const selected = haciendaSelector.value;
  const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');

  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      fullData = data;
      cargarCosechados();
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
    });}
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



const coloresBase = ['NEGRO', 'BLANCO', 'AZUL', 'VERDE', 'AMARILLO', 'CAFE', 'ROJO', 'LILA'];

// Mapea colores a sus códigos RGB o HEX (puedes personalizar)
const coloresMap = {
  'NEGRO': '#000000',
  'BLANCO': '#FFFFFF',
  'AZUL': '#0000FF',
  'VERDE': '#008000',
  'AMARILLO': '#FFFF00',
  'CAFE': '#8B4513',
  'ROJO': '#FF0000',
  'LILA': '#800080'
};

/**
 * @param {number} semana - número de semana (ej. 1, 2, 3...)
 * @param {number} edad - edad del racimo (de 8 a 15)
 * @returns {string} - color en formato HEX
 */
function obtenerColorPorSemanaYEdad(semana, edad) {
  if (edad < 8 || edad > 15) return '#888888';

  const baseIndex = edad - 8; // índice 0..7
  const desplazamiento = (semana - 1) % 8; // ciclo de 8 semanas
  const colorIndex = (baseIndex - desplazamiento + 8) % 8;

  const colorNombre = coloresBase[colorIndex];
  return coloresMap[colorNombre] || '#000000';
}




