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
    const apiKey = '671f6a470eba37e2e650177a9d2e16cf'; // Tu API Key
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

    // Array para almacenar las notas
    let notasGuardadas = JSON.parse(localStorage.getItem('notas')) || [];

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
        // Recopilamos el estado actual de las notas del DOM
        notasGuardadas = Array.from(listaNotas.children).map(li => {
            const spanTexto = li.querySelector('.nota-texto');
            const spanFecha = li.querySelector('.nota-fecha');
            const inputChecked = li.querySelector('input');

            // Aseguramos que la extracción sea robusta
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
        localStorage.setItem('notas', JSON.stringify(notasGuardadas));
    };

    const cargarNotas = () => {
        if (!listaNotas) return;
        listaNotas.innerHTML = ''; // Limpiamos el contenido actual
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

        // Añadimos la nueva nota al DOM y luego guardamos todo
        listaNotas?.appendChild(crearNotaElemento(materia, texto, fecha));
        guardarNotas(); // Persiste la nueva nota
        formNota.reset();
    });

    btnEliminarNotas?.addEventListener('click', () => {
        if (!listaNotas) return;
        // Eliminamos del DOM
        listaNotas.querySelectorAll('input:checked').forEach(el => el.parentElement?.remove());
        guardarNotas(); // Persiste los cambios (notas eliminadas)
    });

    // Este listener guarda cada vez que una nota cambia de estado (marcada/desmarcada)
    listaNotas?.addEventListener('change', guardarNotas);
    cargarNotas(); // Cargar notas al inicio de la página

    // --- TAREAS ---
    const formTarea = document.getElementById('formTarea');
    const listaTareas = document.getElementById('listaTareas');
    const btnEliminarTareas = document.getElementById('btnEliminarTareas');
    const MAX_TAREA_LENGTH = 100;

    // Array para almacenar las tareas
    let tareasGuardadas = JSON.parse(localStorage.getItem('tareas')) || [];

    // Función para generar un ID único más robusto
    const generarId = () => `tarea-${crypto.randomUUID()}`;

    const crearTareaElemento = (materia, texto, fecha = '', id = generarId(), completada = false) => {
        const li = document.createElement('li');
        // El id se usa en el input y label
        li.innerHTML = `
            <input type="checkbox" id="${id}" ${completada ? 'checked' : ''}>
            <label for="${id}">${materia}: ${texto}</label>
            `;
        if (fecha) li.dataset.fecha = fecha; // Guardar la fecha en un dataset
        return li;
    };

    const guardarTareas = () => {
        if (!listaTareas) return;
        // Recopilamos el estado actual de las tareas del DOM
        tareasGuardadas = Array.from(listaTareas.children).map(li => {
            const label = li.querySelector('label');
            const input = li.querySelector('input');
            if (!label || !input) return null;

            // Extraemos materia y texto del label
            const [materia, ...resto] = label.textContent.split(':');
            return {
                id: input.id,
                materia: materia.trim(),
                texto: resto.join(':').trim(),
                completada: input.checked,
                fecha: li.dataset.fecha || '' // Recuperamos la fecha del dataset
            };
        }).filter(Boolean); // Filtramos cualquier entrada nula
        localStorage.setItem('tareas', JSON.stringify(tareasGuardadas));
    };

    const cargarTareas = () => {
        if (!listaTareas) return;
        listaTareas.innerHTML = ''; // Limpiamos el contenido actual
        tareasGuardadas.forEach(({ id, materia, texto, completada, fecha }) => {
            listaTareas.appendChild(crearTareaElemento(materia, texto, fecha, id, completada));
        });
    };

    formTarea?.addEventListener('submit', e => {
        e.preventDefault();
        const materiaSelectElement = formTarea.materiaSelect;
        const materiaParaMostrar = materiaSelectElement.options[materiaSelectElement.selectedIndex].textContent;
        const texto = formTarea.inputTarea.value.trim();
        const fecha = formTarea.fechaTarea ? formTarea.fechaTarea.value : ''; // Obtener la fecha si existe el input
        if (!materiaParaMostrar || !texto || texto.length > MAX_TAREA_LENGTH) return;

        // Añadimos la nueva tarea al DOM y luego guardamos todo
        listaTareas?.appendChild(crearTareaElemento(materiaParaMostrar, texto, fecha));
        guardarTareas(); // Persiste la nueva tarea
        formTarea.reset();
    });

    btnEliminarTareas?.addEventListener('click', () => {
        if (!listaTareas) return;
        // Eliminamos del DOM
        listaTareas.querySelectorAll('input:checked').forEach(el => el.parentElement?.remove());
        guardarTareas(); // Persiste los cambios (tareas eliminadas)
    });

    // Este listener guarda cada vez que una tarea cambia de estado (marcada/desmarcada)
    listaTareas?.addEventListener('change', guardarTareas);
    cargarTareas(); // Cargar tareas al inicio de la página

    // --- EXÁMENES ---
    const formExamen = document.getElementById('formExamen');
    const listaExamenes = document.getElementById('listaExamenes');

    // Array para almacenar los exámenes
    let examenesGuardados = JSON.parse(localStorage.getItem('examenes')) || [];

    const crearExamenElemento = (materia, texto, fecha) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${materia}: ${texto} (${fecha})</span>
            `;
        return li;
    };

    const guardarExamenes = () => {
        if (!listaExamenes) return;
        // Recopilamos el estado actual de los exámenes del DOM
        examenesGuardados = Array.from(listaExamenes.children).map(li => {
            const spanContent = li.querySelector('span')?.textContent;
            if (!spanContent) return null;

            // Dividir el contenido para extraer materia, texto y fecha
            const regex = /^(.*?):\s*(.*?)\s*\((.*?)\)$/;
            const match = spanContent.match(regex);

            if (match) {
                return {
                    materia: match[1].trim(),
                    texto: match[2].trim(),
                    fecha: match[3].trim()
                };
            }
            return null; // Si no hay match, retornar null
        }).filter(Boolean); // Filtramos cualquier entrada nula
        localStorage.setItem('examenes', JSON.stringify(examenesGuardados));
    };

    const cargarExamenes = () => {
        if (!listaExamenes) return;
        listaExamenes.innerHTML = ''; // Limpiamos el contenido actual
        examenesGuardados.forEach(({ materia, texto, fecha }) => {
            listaExamenes.appendChild(crearExamenElemento(materia, texto, fecha));
        });
    };

    formExamen?.addEventListener('submit', e => {
        e.preventDefault();
        const materia = formExamen.materiaExamen.value;
        const texto = formExamen.inputExamen.value.trim();
        const fecha = formExamen.fechaExamen.value;
        if (!materia || !texto || !fecha) return;

        // Añadimos el nuevo examen al DOM y luego guardamos todo
        listaExamenes?.appendChild(crearExamenElemento(materia, texto, fecha));
        guardarExamenes(); // Persiste el nuevo examen
        formExamen.reset();
    });

    cargarExamenes(); // Cargar exámenes al inicio de la página

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

        // Usa las variables que ahora guardan los datos cargados de localStorage
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
                // Usamos la variable que ya está sincronizada con localStorage
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

        const allThs = Array.from(tabla.querySelectorAll('thead th'));
        const filas = Array.from(tabla.querySelectorAll('tbody tr'));

        allThs.forEach((thElement, colIndex) => {
            if (colIndex === 0 && thElement.textContent.trim().toLowerCase() === 'hora') {
                return;
            }
            if (!thElement.textContent.trim()) {
                return;
            }

            let tooltipDiv = null;

            thElement.addEventListener('mouseenter', () => {
                const materias = filas
                    .map(fila => fila.children[colIndex]?.textContent?.trim())
                    .filter(Boolean)
                    .filter(text => text.toLowerCase() !== 'recreo');

                if (materias.length === 0) return;

                // Usamos la variable que ya está sincronizada con localStorage
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
