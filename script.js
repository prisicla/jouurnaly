document.addEventListener('DOMContentLoaded', () => {
    // --- MENÚ ---
    const menuToggle = document.querySelector('.menu-toggle');
    const menuList = document.querySelector('.menu-list');

    // Abre/cierra el menú al hacer clic en el botón de hamburguesa
    menuToggle?.addEventListener('click', () => {
        menuList?.classList.toggle('show');
    });

    // Cierra el menú si se hace clic fuera de él (en móviles)
    document.addEventListener('click', e => {
        if (menuList && menuToggle && !menuList.contains(e.target) && !menuToggle.contains(e.target)) {
            menuList.classList.remove('show');
        }
    });

    // Cierra el menú al hacer clic en un enlace de navegación
    document.querySelectorAll('.menu-list a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const target = document.getElementById(link.getAttribute('href').substring(1));
            target?.scrollIntoView({ behavior: 'smooth' });
            // Cierra el menú después de navegar a la sección
            menuList?.classList.remove('show');
        });
    });

    // --- FECHA ACTUAL ---
    const fechaHoy = document.getElementById('fechaHoy');
    if (fechaHoy) {
        fechaHoy.textContent = new Date().toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // --- CLIMA ---
    const weatherDiv = document.getElementById('weather');
    const apiKey = '671f6a470eba37e2e650177a9d2e16cf';
    const ciudad = 'José C. Paz,AR';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(ciudad)}&units=metric&lang=es&appid=${apiKey}`;

    const actualizarClima = () => {
        fetch(url)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                const temp = Math.round(data.main.temp);
                const icon = data.weather[0].icon;
                if (weatherDiv) {
                    weatherDiv.innerHTML = `<img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="Clima" style="width:24px; vertical-align:middle;" /> <span>${temp}°C</span>`;
                }
            })
            .catch(error => {
                console.error("Error fetching weather:", error);
                if (weatherDiv) {
                    weatherDiv.textContent = 'Clima no disponible';
                }
            });
    };

    if (weatherDiv) {
        actualizarClima();
        setInterval(actualizarClima, 600000); // Actualiza cada 10 minutos (600,000 ms)
    }

    // --- NOTAS ---
    const formNota = document.getElementById('formNota');
    const listaNotas = document.getElementById('listaNotas');
    const btnEliminarNotas = document.getElementById('btnEliminarNotas');

    const crearNotaElemento = (materia, texto, fecha, marcada = false) => {
        const li = document.createElement('li');
        li.dataset.materia = materia;
        li.innerHTML = `
            <input type="checkbox" ${marcada ? 'checked' : ''}>
            <span class="nota-texto">${materia}: ${texto}</span>
            ${fecha ? `<span class="nota-fecha"> (${fecha})</span>` : ''}
            `;
        return li;
    };

    const guardarNotas = () => {
        if (!listaNotas) return;
        const notas = Array.from(listaNotas.children).map(li => {
            const spanTexto = li.querySelector('.nota-texto');
            const spanFecha = li.querySelector('.nota-fecha');
            const inputChecked = li.querySelector('input');

            const textoContent = spanTexto ? spanTexto.textContent.split(': ')[1] : '';
            const fechaContent = spanFecha ? spanFecha.textContent.replace(/[()]/g, '') : '';
            const materiaContent = li.dataset.materia || '';

            return {
                materia: materiaContent,
                texto: textoContent,
                fecha: fechaContent,
                marcada: inputChecked ? inputChecked.checked : false
            };
        });
        localStorage.setItem('notas', JSON.stringify(notas));
    };

    const cargarNotas = () => {
        if (!listaNotas) return;
        const notasGuardadas = JSON.parse(localStorage.getItem('notas')) || [];
        notasGuardadas.forEach(({ materia, texto, fecha, marcada }) => {
            listaNotas.appendChild(crearNotaElemento(materia, texto, fecha, marcada));
        });
    };

    formNota?.addEventListener('submit', e => {
        e.preventDefault();
        const materia = formNota.materiaNota.value;
        const texto = formNota.inputNota.value.trim();
        const fecha = formNota.fechaNota.value;
        if (!materia || !texto) return;
        listaNotas?.appendChild(crearNotaElemento(materia, texto, fecha));
        guardarNotas();
        formNota.reset();
    });

    btnEliminarNotas?.addEventListener('click', () => {
        if (!listaNotas) return;
        listaNotas.querySelectorAll('input:checked').forEach(el => el.parentElement?.remove());
        guardarNotas();
    });

    listaNotas?.addEventListener('change', guardarNotas);
    cargarNotas();

// --- TAREAS ---
    const formTarea = document.getElementById('formTarea');
    const listaTareas = document.getElementById('listaTareas');
    const btnEliminarTareas = document.getElementById('btnEliminarTareas');
    const MAX_TAREA_LENGTH = 100;

    const generarId = () => `tarea-${crypto.randomUUID()}`;

    const crearTareaElemento = (materia, texto, fecha = '', id = generarId(), completada = false) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" id="${id}" ${completada ? 'checked' : ''}>
            <label for="${id}">${materia}: ${texto}</label>
            `;
        if (fecha) li.dataset.fecha = fecha;
        return li;
    };

    const guardarTareas = () => {
        if (!listaTareas) return;
        const tareas = Array.from(listaTareas.children).map(li => {
            const label = li.querySelector('label');
            const input = li.querySelector('input');
            if (!label || !input) return null;
            const [materia, ...resto] = label.textContent.split(':');
            return {
                id: input.id,
                materia: materia.trim(),
                texto: resto.join(':').trim(),
                completada: input.checked,
                fecha: li.dataset.fecha || ''
            };
        }).filter(Boolean);
        localStorage.setItem('tareas', JSON.stringify(tareas));
    };

    const cargarTareas = () => {
        if (!listaTareas) return;
        (JSON.parse(localStorage.getItem('tareas')) || []).forEach(({ id, materia, texto, completada, fecha }) => {
            listaTareas.appendChild(crearTareaElemento(materia, texto, fecha, id, completada));
        });
    };

    formTarea?.addEventListener('submit', e => {
        e.preventDefault();
        // --- CAMBIO AQUÍ ---
        const materiaSelectElement = formTarea.materiaSelect; // Obtener el elemento <select>
        const selectedOption = materiaSelectElement.options[materiaSelectElement.selectedIndex];
        const materiaParaMostrar = selectedOption.textContent; // <--- ¡Esto es lo que necesitas!

        const texto = formTarea.inputTarea.value.trim();
        if (!materiaParaMostrar || !texto || texto.length > MAX_TAREA_LENGTH) return;
        
        listaTareas?.appendChild(crearTareaElemento(materiaParaMostrar, texto)); // Usar la materia con el texto correcto
        guardarTareas();
        formTarea.reset();
    });

    btnEliminarTareas?.addEventListener('click', () => {
        if (!listaTareas) return;
        listaTareas.querySelectorAll('input:checked').forEach(el => el.parentElement?.remove());
        guardarTareas();
    });

    listaTareas?.addEventListener('change', guardarTareas);
    cargarTareas();

    // ... el resto de tu código ...

    // --- EXÁMENES ---
    const formExamen = document.getElementById('formExamen');
    const listaExamenes = document.getElementById('listaExamenes');

    const crearExamenElemento = (materia, texto, fecha) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${materia}: ${texto} (${fecha})</span>
            `;
        return li;
    };

    const guardarExamenes = () => {
        if (!listaExamenes) return;
        const examenes = Array.from(listaExamenes.children).map(li => {
            const spanContent = li.querySelector('span')?.textContent;
            if (!spanContent) return null;

            const [materiaTexto, fechaTexto] = spanContent.split(' (');
            const [materia, ...resto] = materiaTexto.split(':');
            return {
                materia: materia.trim(),
                texto: resto.join(':').trim(),
                fecha: fechaTexto?.replace(')', '') || ''
            };
        }).filter(Boolean);
        localStorage.setItem('examenes', JSON.stringify(examenes));
    };

    const cargarExamenes = () => {
        if (!listaExamenes) return;
        (JSON.parse(localStorage.getItem('examenes')) || []).forEach(({ materia, texto, fecha }) => {
            listaExamenes.appendChild(crearExamenElemento(materia, texto, fecha));
        });
    };

    formExamen?.addEventListener('submit', e => {
        e.preventDefault();
        const materia = formExamen.materiaExamen.value;
        const texto = formExamen.inputExamen.value.trim();
        const fecha = formExamen.fechaExamen.value;
        if (!materia || !texto || !fecha) return;
        listaExamenes?.appendChild(crearExamenElemento(materia, texto, fecha));
        guardarExamenes();
        formExamen.reset();
    });

    cargarExamenes();

    // --- HOY ---
    const actualizarHoy = () => {
        const listaHoy = document.getElementById('listaHoy');
        if (!listaHoy) return;
        listaHoy.innerHTML = '';

        const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const diaHoy = dias[new Date().getDay()];
        const tabla = document.querySelector('#horario table');
        if (!tabla) return;

        const colIndex = Array.from(tabla.querySelectorAll('thead th'))
            .findIndex(th => th.textContent.toLowerCase().trim() === diaHoy);

        if (colIndex === -1) {
             console.warn(`No se encontró la columna para el día '${diaHoy}' en el horario.`);
             return;
        }

        const materiasHoy = Array.from(tabla.querySelectorAll('tbody tr'))
            .map(row => row.children[colIndex]?.textContent?.toLowerCase().trim())
            .filter(Boolean)
            .filter(text => text !== 'recreo');

        const hoyStr = new Date().toISOString().split('T')[0];
        const normalizar = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

        const agregarAListaHoy = (items, usarFecha = true) => {
            items.forEach(({ materia, texto, fecha, completada }) => {
                if (completada) return;

                const coincideMateria = materia && materiasHoy.some(m => normalizar(m) === normalizar(materia));
                const coincideFecha = usarFecha && fecha === hoyStr;

                if (coincideMateria || coincideFecha) {
                    const li = document.createElement('li');
                    li.textContent = `${materia}: ${texto}`;
                    listaHoy.appendChild(li);
                }
            });
        };

        agregarAListaHoy(JSON.parse(localStorage.getItem('tareas')) || [], false);
        agregarAListaHoy(JSON.parse(localStorage.getItem('notas')) || []);
        agregarAListaHoy(JSON.parse(localStorage.getItem('examenes')) || []);
    };

    actualizarHoy();

    // --- TEMA CLARO/OSCURO ---
    const themeToggleBtn = document.getElementById("theme-toggle");
    const themeIcon = document.getElementById("theme-icon");
    const bodyElement = document.body;

    const savedTheme = localStorage.getItem("tema");
    if (savedTheme === "oscuro") {
        bodyElement.classList.add("dark");
        themeIcon?.classList.replace("fa-moon", "fa-sun");
    } else {
        bodyElement.classList.remove("dark");
        themeIcon?.classList.replace("fa-sun", "fa-moon");
    }

    themeToggleBtn?.addEventListener("click", () => {
        bodyElement.classList.toggle("dark");
        const isDarkMode = bodyElement.classList.contains("dark");

        if (isDarkMode) {
            themeIcon?.classList.replace("fa-moon", "fa-sun");
            localStorage.setItem("tema", "oscuro");
        } else {
            themeIcon?.classList.replace("fa-sun", "fa-moon");
            localStorage.setItem("tema", "claro");
        }
    });

    // --- TOOLTIP EN HORARIO: TAREAS POR MATERIA (celdas) ---
    const inicializarTooltipsHorario = () => {
        const celdasHorario = document.querySelectorAll('#horario td');

        const normalizar = str =>
            str.normalize("NFD").replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

        celdasHorario.forEach(celda => {
            let tooltipDiv = null;

            celda.addEventListener('mouseenter', () => {
                const materiaTexto = celda.textContent.trim();
                if (!materiaTexto || materiaTexto.toLowerCase() === 'recreo') return;

                const materiaNorm = normalizar(materiaTexto);
                const tareas = JSON.parse(localStorage.getItem('tareas')) || [];
                const tareasMateria = tareas.filter(t =>
                    normalizar(t.materia) === materiaNorm && !t.completada
                );

                tooltipDiv = document.createElement('div');
                tooltipDiv.className = 'tooltip show';

                if (tareasMateria.length > 0) {
                    tooltipDiv.innerHTML = `<strong>${tareasMateria.length === 1 ? 'Tarea pendiente:' : 'Tareas pendientes:'}</strong><br>${tareasMateria.map(t => `• ${t.texto}`).join('<br>')}`;
                } else {
                    tooltipDiv.innerHTML = `<em>No se registran tareas pendientes.</em>`;
                }

                document.body.appendChild(tooltipDiv);

                const rect = celda.getBoundingClientRect();
                tooltipDiv.style.position = 'absolute';
                tooltipDiv.style.zIndex = '2000';

                let top = rect.top + window.scrollY - tooltipDiv.offsetHeight - 8;
                let left = rect.left + window.scrollX + (rect.width - tooltipDiv.offsetWidth) / 2;

                if (left < 0) { left = 5; }
                if (left + tooltipDiv.offsetWidth > window.innerWidth) {
                    left = window.innerWidth - tooltipDiv.offsetWidth - 5;
                }
                if (top < 0) {
                    top = rect.bottom + window.scrollY + 8;
                }

                tooltipDiv.style.top = `${top}px`;
                tooltipDiv.style.left = `${left}px`;
            });

            celda.addEventListener('mouseleave', () => {
                if (tooltipDiv) {
                    tooltipDiv.classList.remove('show');
                    setTimeout(() => tooltipDiv?.remove(), 300);
                    tooltipDiv = null;
                }
            });
        });
    };

    inicializarTooltipsHorario();

    // --- TOOLTIP EN HORARIO: TAREAS POR DÍA (encabezados) ---
    const inicializarTooltipsDiasHorario = () => {
        const tabla = document.querySelector('#horario table');
        if (!tabla) return;

        const normalizar = str =>
            str.normalize("NFD").replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

        // Obtener todos los TH de la cabecera de la tabla
        const allThs = Array.from(tabla.querySelectorAll('thead th'));
        const filas = Array.from(tabla.querySelectorAll('tbody tr'));

        allThs.forEach((thElement, colIndex) => {
            // No queremos un tooltip para la primera columna si es la de la hora
            // O si el texto del encabezado está vacío o es un espacio en blanco
            if (colIndex === 0 && thElement.textContent.trim().toLowerCase() === 'hora') {
                return;
            }
            if (!thElement.textContent.trim()) { // En caso de que haya un TH vacío
                 return;
            }

            let tooltipDiv = null;

            thElement.addEventListener('mouseenter', () => {
                const materias = filas
                    // Usamos colIndex directamente ya que es el índice real de la columna
                    .map(fila => fila.children[colIndex]?.textContent?.trim())
                    .filter(Boolean)
                    .filter(text => text.toLowerCase() !== 'recreo');

                if (materias.length === 0) return;

                const tareas = JSON.parse(localStorage.getItem('tareas')) || [];
                const tareasPendientesDia = tareas.filter(t =>
                    materias.some(m => normalizar(t.materia) === normalizar(m)) && !t.completada
                );

                if (tareasPendientesDia.length === 0) return;

                tooltipDiv = document.createElement('div');
                tooltipDiv.className = 'tooltip show';
                tooltipDiv.innerHTML = `<strong>${tareasPendientesDia.length === 1 ? 'Tarea pendiente del día:' : 'Tareas pendientes del día:'}</strong><br>${tareasPendientesDia.map(t => `• ${t.texto} (${t.materia})`).join('<br>')}`;

                document.body.appendChild(tooltipDiv);

                const rect = thElement.getBoundingClientRect();
                tooltipDiv.style.position = 'absolute';
                tooltipDiv.style.zIndex = '2000';

                let top = rect.bottom + window.scrollY + 8;
                let left = rect.left + window.scrollX + (rect.width - tooltipDiv.offsetWidth) / 2;

                if (left < 0) { left = 5; }
                if (left + tooltipDiv.offsetWidth > window.innerWidth) {
                    left = window.innerWidth - tooltipDiv.offsetWidth - 5;
                }

                tooltipDiv.style.top = `${top}px`;
                tooltipDiv.style.left = `${left}px`;
            });

            thElement.addEventListener('mouseleave', () => {
                if (tooltipDiv) {
                    tooltipDiv.classList.remove('show');
                    setTimeout(() => tooltipDiv?.remove(), 300);
                    tooltipDiv = null;
                }
            });
        });
    };

    inicializarTooltipsDiasHorario();
});
