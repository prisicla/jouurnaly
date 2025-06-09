document.addEventListener('DOMContentLoaded', () => {
    // --- Utilidades y Constantes ---
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const MAX_TAREA_LENGTH = 100;
    const API_KEY_WEATHER = '671f6a470eba37e2e650177a9d2e16cf'; // Tu API Key

    // Función para normalizar strings (quita acentos, convierte a minúsculas, trim)
    const normalizarString = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    // Generador de IDs únicos (más robusto que UUID en algunos entornos)
    const generarId = () => `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // --- Selectores de DOM (centralizados para mejor mantenimiento) ---
    const menuToggle = document.querySelector('.menu-toggle');
    const menuList = document.querySelector('.menu-list');
    const weatherDiv = document.getElementById('weather');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const tooltip = document.getElementById('tooltip');
    const mainHeaderTitle = document.querySelector('header.main-header h1');

    // Tareas
    const formTarea = document.getElementById('formTarea');
    const listaTareas = document.getElementById('listaTareas');
    const btnEliminarTareas = document.getElementById('btnEliminarTareas');
    let tareasGuardadas = JSON.parse(localStorage.getItem('tareas')) || [];

    // Notas
    const formNota = document.getElementById('formNota');
    const listaNotas = document.getElementById('listaNotas');
    const btnEliminarNotas = document.getElementById('btnEliminarNotas');
    let notasGuardadas = JSON.parse(localStorage.getItem('notas')) || [];

    // Exámenes
    const formExamen = document.getElementById('formExamen');
    const listaExamenes = document.getElementById('listaExamenes');
    let examenesGuardados = JSON.parse(localStorage.getItem('examenes')) || [];

    // Hoy
    let currentDisplayedDate = new Date();
    const listaHoyElement = document.getElementById('listaHoy');
    const currentDayDisplayElement = document.getElementById('currentDayDisplay');
    const currentDayTitleElement = document.getElementById('currentDayTitle');
    const prevDayBtn = document.getElementById('prevDayBtn');
    const nextDayBtn = document.getElementById('nextDayBtn');

    // --- MENÚ ---
    if (menuToggle && menuList) {
        // Abre/cierra el menú al hacer clic en el botón de hamburguesa
        menuToggle.addEventListener('click', () => {
            menuList.classList.toggle('show');
            menuToggle.setAttribute('aria-expanded', menuList.classList.contains('show'));
        });

        // Cierra el menú si se hace clic fuera de él (en móviles)
        document.addEventListener('click', e => {
            if (!menuList.contains(e.target) && !menuToggle.contains(e.target)) {
                menuList.classList.remove('show');
                menuToggle.setAttribute('aria-expanded', false);
            }
        });

        // Cierra el menú al hacer clic en un enlace de navegación y desplaza suavemente
        document.querySelectorAll('.menu-list a[href^="#"]').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    // Cierra el menú ANTES de desplazar para una mejor UX
                    menuList.classList.remove('show');
                    menuToggle.setAttribute('aria-expanded', false);

                    targetElement.scrollIntoView({ behavior: 'smooth' });

                    // Opcional: enfocar el elemento después de desplazarse para accesibilidad
                    targetElement.focus({ preventScroll: true }); // preventScroll para no volver a desplazar
                }
            });
        });

        // Cierra el menú cuando la ventana cambia de tamaño (de móvil a escritorio, por ejemplo)
        // Esto evita que el menú quede abierto si el usuario rota el dispositivo o redimensiona la ventana
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && menuList.classList.contains('show')) { // Ajusta 768px a tu breakpoint de CSS
                menuList.classList.remove('show');
                menuToggle.setAttribute('aria-expanded', false);
            }
        });
    }

    // --- CLIMA ---
    const actualizarClima = async () => {
        if (!weatherDiv) {
            console.warn("Elemento 'weather' no encontrado en el DOM.");
            return;
        }

        const lat = -34.52; // Latitud de José C. Paz
        const lon = -58.75; // Longitud de José C. Paz
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY_WEATHER}`;

        try {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();

            const temp = Math.round(data.main.temp);
            const iconCode = data.weather[0].icon;
            const description = data.weather[0].description;

            // Mapeo de iconos de OpenWeatherMap a FontAwesome
            let faIconClass = 'fa-question-circle';
            if (iconCode.includes('01d')) faIconClass = 'fa-sun'; // Clear sky day
            else if (iconCode.includes('01n')) faIconClass = 'fa-moon'; // Clear sky night
            else if (iconCode.includes('02') || iconCode.includes('03') || iconCode.includes('04')) faIconClass = 'fa-cloud'; // Clouds
            else if (iconCode.includes('09') || iconCode.includes('10')) faIconClass = 'fa-cloud-showers-heavy'; // Rain
            else if (iconCode.includes('11')) faIconClass = 'fa-bolt'; // Thunderstorm
            else if (iconCode.includes('13')) faIconClass = 'fa-snowflake'; // Snow
            else if (iconCode.includes('50')) faIconClass = 'fa-smog'; // Mist

            weatherDiv.innerHTML = `
                <i class="fas ${faIconClass}" title="${description}"></i>
                <span id="temperature">${temp}°C</span>
                <span id="weather-description" class="sr-only">${description.charAt(0).toUpperCase() + description.slice(1)}</span>
            `;
            // Agregado sr-only para descripción para mejorar accesibilidad sin ocupar espacio visual extra
        } catch (error) {
            console.error("Error fetching weather:", error);
            if (weatherDiv) {
                weatherDiv.innerHTML = `<i class="fas fa-exclamation-triangle" title="Clima no disponible"></i> <span class="sr-only">Clima no disponible</span>`;
            }
        }
    };

    if (weatherDiv) {
        actualizarClima();
        setInterval(actualizarClima, 600000); // Actualiza cada 10 minutos
    }

    // --- PERSISTENCIA DE DATOS (Centralizada y genérica) ---
    const saveData = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
        // Llama a loadTasksForDay después de cada guardado para mantener la sección "Hoy" actualizada
        loadTasksForDay(currentDisplayedDate);
    };

    const loadData = (key) => {
        return JSON.parse(localStorage.getItem(key)) || [];
    };

    // --- NOTAS ---
    const crearNotaElemento = (materia, texto, fecha, marcada = false) => {
        const li = document.createElement('li');
        li.dataset.materia = materia;
        li.innerHTML = `
            <input type="checkbox" id="nota-${generarId()}" ${marcada ? 'checked' : ''}>
            <label for="nota-${generarId()}">
                <span class="nota-materia">${materia.charAt(0).toUpperCase() + materia.slice(1)}:</span>
                <span class="nota-texto">${texto}</span>
                ${fecha ? `<span class="nota-fecha"> (${new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })})</span>` : ''}
            </label>
        `;
        // Agregado span.nota-materia y .nota-texto para mejor segmentación en CSS
        return li;
    };

    const cargarNotas = () => {
        if (!listaNotas) return;
        listaNotas.innerHTML = '';
        notasGuardadas = loadData('notas'); // Asegura que carga lo último
        if (notasGuardadas.length === 0) {
            listaNotas.innerHTML = '<li class="no-items">No hay notas.</li>';
        } else {
            notasGuardadas.forEach(({ materia, texto, fecha, marcada }) => {
                listaNotas.appendChild(crearNotaElemento(materia, texto, fecha, marcada));
            });
        }
    };

    formNota?.addEventListener('submit', e => {
        e.preventDefault();
        const materia = formNota.materiaNota.value;
        const texto = formNota.inputNota.value.trim();
        const fecha = formNota.fechaNota.value;

        if (!materia || !texto) {
            alert('Por favor, selecciona una materia y escribe una nota.');
            return;
        }

        // Eliminar el mensaje "No hay notas" si existe
        const noItemsMessage = listaNotas.querySelector('.no-items');
        if (noItemsMessage) noItemsMessage.remove();

        notasGuardadas.push({ materia, texto, fecha, marcada: false });
        saveData('notas', notasGuardadas);
        cargarNotas(); // Volver a cargar para reflejar el estado actual
        formNota.reset();
    });

    btnEliminarNotas?.addEventListener('click', () => {
        if (!listaNotas) return;
        const checkedNotes = Array.from(listaNotas.querySelectorAll('input:checked'));
        if (checkedNotes.length === 0) {
            alert('No hay notas seleccionadas para eliminar.');
            return;
        }
        
        // Filtrar las notas marcadas para eliminarlas del array guardado
        notasGuardadas = notasGuardadas.filter((nota, index) => {
            // Encuentra el índice de la nota en la lista visual para ver si su checkbox está marcado
            const correspondingLi = listaNotas.children[index];
            return correspondingLi ? !correspondingLi.querySelector('input')?.checked : true;
        });

        saveData('notas', notasGuardadas);
        cargarNotas(); // Volver a cargar para reflejar el estado actual
    });

    listaNotas?.addEventListener('change', (e) => {
        if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
            const listItem = e.target.closest('li');
            const index = Array.from(listaNotas.children).indexOf(listItem);
            if (index > -1) {
                notasGuardadas[index].marcada = e.target.checked;
                saveData('notas', notasGuardadas);
            }
        }
    });

    cargarNotas();

    // --- TAREAS ---
    const crearTareaElemento = (materia, texto, id = generarId(), completada = false) => {
        const li = document.createElement('li');
        li.dataset.materia = materia;
        li.setAttribute('role', 'listitem'); // Añadido rol para accesibilidad
        li.innerHTML = `
            <input type="checkbox" id="${id}" ${completada ? 'checked' : ''} aria-label="Marcar tarea como completada">
            <label for="${id}" class="${completada ? 'completed' : ''}">
                ${materia === 'general' ? '<span class="sr-only">General:</span>' : `<span class="tarea-materia">${materia.charAt(0).toUpperCase() + materia.slice(1)}:</span>`}
                <span class="tarea-texto">${texto}</span>
            </label>
        `;
        // Clases específicas para materia y texto, y aria-label para accesibilidad.
        // `sr-only` para "General" si no queremos que ocupe espacio visual.
        return li;
    };

    const cargarTareas = () => {
        if (!listaTareas) return;
        listaTareas.innerHTML = '';
        tareasGuardadas = loadData('tareas'); // Asegura que carga lo último
        if (tareasGuardadas.length === 0) {
            const noTasksMessage = document.createElement('li');
            noTasksMessage.classList.add('no-items'); // Clase genérica
            noTasksMessage.textContent = 'No hay tareas pendientes.';
            listaTareas.appendChild(noTasksMessage);
        } else {
            tareasGuardadas.forEach(({ id, materia, texto, completada }) => {
                listaTareas.appendChild(crearTareaElemento(materia, texto, id, completada));
            });
        }
    };

    formTarea?.addEventListener('submit', e => {
        e.preventDefault();
        const materia = document.getElementById('materiaSelect').value;
        const texto = document.getElementById('inputTarea').value.trim();

        if (!texto || texto.length > MAX_TAREA_LENGTH || !materia) {
            alert('Por favor, selecciona una materia y escribe una tarea (máx. 100 caracteres).');
            return;
        }

        // Eliminar el mensaje "No hay tareas" si existe
        const noItemsMessage = listaTareas.querySelector('.no-items');
        if (noItemsMessage) noItemsMessage.remove();

        const nuevaTarea = { id: generarId(), materia, texto, completada: false };
        tareasGuardadas.push(nuevaTarea);
        saveData('tareas', tareasGuardadas);
        cargarTareas(); // Recargar para reflejar el estado actual
        formTarea.reset();
    });

    btnEliminarTareas?.addEventListener('click', () => {
        if (!listaTareas) return;
        const checkedTasks = Array.from(listaTareas.querySelectorAll('input:checked'));
        if (checkedTasks.length === 0) {
            alert('No hay tareas completadas para eliminar.');
            return;
        }
        
        // Filtra las tareas que NO están marcadas para mantenerlas
        tareasGuardadas = tareasGuardadas.filter(tarea => {
            const correspondingLi = listaTareas.querySelector(`input[id="${tarea.id}"]`);
            return correspondingLi ? !correspondingLi.checked : true;
        });

        saveData('tareas', tareasGuardadas);
        cargarTareas(); // Recargar para reflejar el estado actual
    });

    listaTareas?.addEventListener('change', (e) => {
        if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
            const listItem = e.target.closest('li');
            if (listItem) {
                const taskId = e.target.id;
                const tareaIndex = tareasGuardadas.findIndex(t => t.id === taskId);
                if (tareaIndex > -1) {
                    tareasGuardadas[tareaIndex].completada = e.target.checked;
                    listItem.querySelector('label')?.classList.toggle('completed', e.target.checked);
                    saveData('tareas', tareasGuardadas);
                }
            }
        }
    });

    cargarTareas(); // Cargar tareas al inicio

    // --- EXÁMENES ---
    const crearExamenElemento = (materia, texto, fecha) => {
        const li = document.createElement('li');
        li.dataset.materia = materia;
        li.dataset.fecha = fecha; // Almacenar la fecha original YYYY-MM-DD
        li.setAttribute('role', 'listitem');
        
        // Formatear la fecha para mostrarla
        const displayDate = new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

        li.innerHTML = `
            <span class="examen-materia">${materia.charAt(0).toUpperCase() + materia.slice(1)}:</span>
            <span class="examen-texto">${texto}</span>
            <span class="examen-fecha"> (Fecha: ${displayDate})</span>
        `;
        return li;
    };

    const cargarExamenes = () => {
        if (!listaExamenes) return;
        listaExamenes.innerHTML = '';
        examenesGuardados = loadData('examenes'); // Asegura que carga lo último

        // Ordenar exámenes por fecha ascendente
        examenesGuardados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        if (examenesGuardados.length === 0) {
            listaExamenes.innerHTML = '<li class="no-items">No hay exámenes programados.</li>';
        } else {
            examenesGuardados.forEach(({ materia, texto, fecha }) => {
                listaExamenes.appendChild(crearExamenElemento(materia, texto, fecha));
            });
        }
    };

    formExamen?.addEventListener('submit', e => {
        e.preventDefault();
        const materia = formExamen.materiaExamen.value;
        const texto = formExamen.inputExamen.value.trim();
        const fecha = formExamen.fechaExamen.value;

        if (!materia || !texto || !fecha) {
            alert('Por favor, selecciona materia, tema y fecha para el examen.');
            return;
        }

        // Eliminar el mensaje "No hay exámenes" si existe
        const noItemsMessage = listaExamenes.querySelector('.no-items');
        if (noItemsMessage) noItemsMessage.remove();

        examenesGuardados.push({ materia, texto, fecha });
        saveData('examenes', examenesGuardados);
        cargarExamenes(); // Recargar para reflejar el estado actual y el orden
        formExamen.reset();
    });

    cargarExamenes();

    // --- NAVEGACIÓN DE DÍAS (PARA SECCIÓN HOY) ---

    // Función para obtener materias del horario para un día específico
    function getMateriasDelDia(date) {
        const dayOfWeek = date.getDay(); // 0 (Domingo) - 6 (Sábado)
        const currentDayNameRaw = dayNames[dayOfWeek];
        const currentDayNameNormalized = normalizarString(currentDayNameRaw);

        const materiasEnHorario = new Set();
        const horarioTable = document.querySelector('#horario table');
        if (!horarioTable) {
            console.warn("Tabla de horario con ID 'horario' no encontrada.");
            return [];
        }

        const headerCells = horarioTable.querySelectorAll('thead th');
        let dayColumnIndex = -1;

        Array.from(headerCells).forEach((th, index) => {
            if (normalizarString(th.textContent) === currentDayNameNormalized) {
                dayColumnIndex = index;
            }
        });

        if (dayColumnIndex === -1) {
            // Esto puede pasar si el horario no cubre todos los días de la semana (ej: solo L-V)
            console.log(`No se encontró la columna para el día: ${currentDayNameRaw} en el horario.`);
            return [];
        }

        const bodyRows = horarioTable.querySelectorAll('tbody tr');
        bodyRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells[dayColumnIndex]) {
                const materiaCell = cells[dayColumnIndex];
                const materia = materiaCell.dataset.materia || materiaCell.textContent.trim();
                if (materia && normalizarString(materia) !== "libre" && normalizarString(materia) !== "recreo" && materia.trim() !== "") {
                    materiasEnHorario.add(normalizarString(materia));
                }
            }
        });
        return Array.from(materiasEnHorario);
    }

    // Función principal para cargar y mostrar tareas, notas y exámenes para un día
    function loadTasksForDay(date) {
        if (!listaHoyElement || !currentDayDisplayElement || !currentDayTitleElement) {
            console.error("Algunos elementos de la sección 'Hoy' no fueron encontrados.");
            return;
        }

        const dayOfWeek = dayNames[date.getDay()];
        const dayOfMonth = date.getDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        currentDayTitleElement.textContent = `Hoy`; // El título siempre es "Hoy"
        currentDayDisplayElement.textContent = `${dayOfWeek} ${dayOfMonth} de ${month} ${year}`;

        listaHoyElement.innerHTML = ''; // Limpia la lista

        const materiasDelDia = getMateriasDelDia(date);
        const hoyStr = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD para comparación de fechas

        let itemsFound = false;

        // Tareas para "Hoy"
        tareasGuardadas.forEach(item => {
            const itemMateriaNormalized = normalizarString(item.materia || '');
            const isMateriaForToday = materiasDelDia.includes(itemMateriaNormalized) || itemMateriaNormalized === 'general';
            
            // Si la tarea no está completada y corresponde a una materia del día o es general
            if (!item.completada && isMateriaForToday) {
                const listItem = document.createElement('li');
                // Formato mejorado para la tarea en "Hoy"
                const materiaDisplay = item.materia === 'general' ? 'General' : item.materia.charAt(0).toUpperCase() + item.materia.slice(1);
                listItem.textContent = `${materiaDisplay}: Tarea - ${item.texto}`;
                listaHoyElement.appendChild(listItem);
                itemsFound = true;
            }
        });

        // Notas para "Hoy" (solo si tienen fecha y coincide con el día)
        notasGuardadas.forEach(item => {
            const itemMateriaNormalized = normalizarString(item.materia || '');
            const isMateriaForToday = materiasDelDia.includes(itemMateriaNormalized) || itemMateriaNormalized === 'general';
            const isDateForToday = item.fecha && item.fecha === hoyStr;

            if (!item.marcada && (isMateriaForToday || isDateForToday)) {
                const listItem = document.createElement('li');
                const materiaDisplay = item.materia === 'general' ? 'General' : item.materia.charAt(0).toUpperCase() + item.materia.slice(1);
                const fechaTexto = item.fecha ? ` (Fecha: ${new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })})` : '';
                listItem.textContent = `${materiaDisplay}: Nota - ${item.texto}${fechaTexto}`;
                listaHoyElement.appendChild(listItem);
                itemsFound = true;
            }
        });

        // Exámenes para "Hoy" (solo si tienen fecha y coincide con el día)
        examenesGuardados.forEach(item => {
            const itemMateriaNormalized = normalizarString(item.materia || '');
            const isMateriaForToday = materiasDelDia.includes(itemMateriaNormalized);
            const isDateForToday = item.fecha && item.fecha === hoyStr;

            if (isMateriaForToday || isDateForToday) { // Los exámenes no tienen estado "completado"
                const listItem = document.createElement('li');
                const materiaDisplay = item.materia.charAt(0).toUpperCase() + item.materia.slice(1);
                const fechaTexto = ` (Fecha: ${new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })})`;
                listItem.textContent = `${materiaDisplay}: Examen - ${item.texto}${fechaTexto}`;
                listaHoyElement.appendChild(listItem);
                itemsFound = true;
            }
        });

        if (!itemsFound) {
            listaHoyElement.innerHTML = '<li class="no-items">¡No hay elementos pendientes para este día!</li>';
        }
    }

    // Funciones para navegación de días
    function changeDay(offset) {
        const newDate = new Date(currentDisplayedDate);
        newDate.setDate(newDate.getDate() + offset);
        currentDisplayedDate = newDate;
        loadTasksForDay(currentDisplayedDate);
    }

    // Carga inicial de la sección Hoy y asignación de eventos de navegación
    loadTasksForDay(currentDisplayedDate);

    if (prevDayBtn) {
        prevDayBtn.addEventListener('click', () => changeDay(-1));
    }
    if (nextDayBtn) {
        nextDayBtn.addEventListener('click', () => changeDay(1));
    }

    // --- Lógica para el botón de tema (Dark Mode) ---
    if (themeToggle && themeIcon) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.classList.add(savedTheme);
            themeIcon.classList.replace('fa-moon', savedTheme === 'dark' ? 'fa-sun' : 'fa-moon');
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            const isDarkMode = document.body.classList.contains('dark');
            themeIcon.classList.replace(isDarkMode ? 'fa-moon' : 'fa-sun', isDarkMode ? 'fa-sun' : 'fa-moon');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        });
    }

    // --- Lógica del tooltip general (el que aparece en "Journaly" en el header) ---
    let tooltipTimeout;

    function showGenericTooltip(text, event) {
        if (!tooltip) return;
        tooltip.textContent = text;
        tooltip.style.left = `${event.pageX + 15}px`;
        tooltip.style.top = `${event.pageY + 15}px`;
        tooltip.classList.add('show');
    }

    function hideGenericTooltip() {
        if (tooltip) {
            tooltip.classList.remove('show');
        }
    }

    if (mainHeaderTitle) {
        mainHeaderTitle.addEventListener('mouseover', (e) => {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = setTimeout(() => {
                showGenericTooltip('Haz clic para volver al inicio', e);
            }, 500);
        });

        mainHeaderTitle.addEventListener('mousemove', (e) => {
            if (tooltip && tooltip.classList.contains('show')) {
                tooltip.style.left = `${e.pageX + 15}px`;
                tooltip.style.top = `${e.pageY + 15}px`;
            }
        });

        mainHeaderTitle.addEventListener('mouseout', () => {
            clearTimeout(tooltipTimeout);
            hideGenericTooltip();
        });

        mainHeaderTitle.addEventListener('click', () => {
            window.location.reload(); // Recarga la página, como si volvieras al inicio
        });
    }

    // --- TOOLTIPS EN HORARIO ---
    const inicializarTooltipsHorario = () => {
        const celdasHorario = document.querySelectorAll('#horario td');

        celdasHorario.forEach(celda => {
            let tooltipDiv = null; // Usar una variable local para cada celda

            celda.addEventListener('mouseenter', (event) => {
                const materiaTexto = celda.dataset.materia || celda.textContent.trim();
                if (!materiaTexto || normalizarString(materiaTexto) === 'recreo' || normalizarString(materiaTexto) === 'libre' || materiaTexto.trim() === "") {
                    return;
                }

                const materiaNorm = normalizarString(materiaTexto);
                const tareasMateria = tareasGuardadas.filter(t =>
                    normalizarString(t.materia) === materiaNorm && !t.completada
                );

                tooltipDiv = document.createElement('div');
                tooltipDiv.className = 'tooltip show';

                if (tareasMateria.length > 0) {
                    tooltipDiv.innerHTML = `<strong>${tareasMateria.length === 1 ? 'Tarea pendiente:' : 'Tareas pendientes:'}</strong><br>${tareasMateria.map(t => `• ${t.texto}`).join('<br>')}`;
                } else {
                    tooltipDiv.innerHTML = `<em>No se registran tareas pendientes para esta materia.</em>`;
                }

                document.body.appendChild(tooltipDiv);

                // Posicionamiento dinámico del tooltip
                const rect = celda.getBoundingClientRect();
                tooltipDiv.style.position = 'absolute';
                tooltipDiv.style.zIndex = '2000';

                let top = rect.top + window.scrollY - tooltipDiv.offsetHeight - 8;
                let left = rect.left + window.scrollX + (rect.width - tooltipDiv.offsetWidth) / 2;

                // Ajustes para que el tooltip no se salga de la pantalla
                if (left < 0) { left = 5; }
                if (left + tooltipDiv.offsetWidth > window.innerWidth) {
                    left = window.innerWidth - tooltipDiv.offsetWidth - 5;
                }
                if (top < 0) { // Si no hay espacio arriba, posicionar abajo
                    top = rect.bottom + window.scrollY + 8;
                }

                tooltipDiv.style.top = `${top}px`;
                tooltipDiv.style.left = `${left}px`;
            });

            celda.addEventListener('mouseleave', () => {
                if (tooltipDiv) {
                    tooltipDiv.classList.remove('show');
                    // Retraso para que la transición CSS de fade-out sea visible
                    setTimeout(() => tooltipDiv?.remove(), 300);
                    tooltipDiv = null;
                }
            });
        });
    };

    inicializarTooltipsHorario(); // Llamar al iniciar

    const inicializarTooltipsDiasHorario = () => {
        const tabla = document.querySelector('#horario table');
        if (!tabla) return;

        const allThs = Array.from(tabla.querySelectorAll('thead th'));
        const filas = Array.from(tabla.querySelectorAll('tbody tr'));

        allThs.forEach((thElement, colIndex) => {
            if (!thElement.textContent.trim() || colIndex >= dayNames.length) { // Asegura que el TH es un día de la semana
                return;
            }

            let tooltipDiv = null;

            thElement.addEventListener('mouseenter', () => {
                const dayOfWeekNormalized = normalizarString(thElement.textContent);
                
                // Obtener todas las materias asociadas a este día (columna) en el horario
                const materiasDeColumna = filas
                    .map(fila => fila.children[colIndex]?.dataset.materia || fila.children[colIndex]?.textContent?.trim())
                    .filter(Boolean)
                    .map(m => normalizarString(m))
                    .filter(m => m !== 'recreo' && m !== 'libre' && m.trim() !== '');

                // Filtrar tareas que corresponden a estas materias o son "general"
                const tareasPendientesDia = tareasGuardadas.filter(t =>
                    (materiasDeColumna.includes(normalizarString(t.materia)) || normalizarString(t.materia) === 'general') && !t.completada
                );
                
                // Filtrar exámenes que corresponden a estas materias
                const examenesPendientesDia = examenesGuardados.filter(e =>
                    materiasDeColumna.includes(normalizarString(e.materia))
                );

                if (tareasPendientesDia.length === 0 && examenesPendientesDia.length === 0) return;

                tooltipDiv = document.createElement('div');
                tooltipDiv.className = 'tooltip show';
                let tooltipContent = '';

                if (tareasPendientesDia.length > 0) {
                    tooltipContent += `<strong>${tareasPendientesDia.length === 1 ? 'Tarea pendiente:' : 'Tareas pendientes:'}</strong><br>${tareasPendientesDia.map(t => {
                        const materiaDisplay = t.materia === 'general' ? 'General' : t.materia.charAt(0).toUpperCase() + t.materia.slice(1);
                        return `• ${materiaDisplay}: ${t.texto}`;
                    }).join('<br>')}`;
                }
                if (examenesPendientesDia.length > 0) {
                    if (tooltipContent) tooltipContent += '<br><br>'; // Separador si hay tareas
                    tooltipContent += `<strong>${examenesPendientesDia.length === 1 ? 'Examen programado:' : 'Exámenes programados:'}</strong><br>${examenesPendientesDia.map(e => {
                        const materiaDisplay = e.materia.charAt(0).toUpperCase() + e.materia.slice(1);
                        const displayDate = new Date(e.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        return `• ${materiaDisplay}: ${e.texto} (Fecha: ${displayDate})`;
                    }).join('<br>')}`;
                }
                
                tooltipDiv.innerHTML = tooltipContent;
                document.body.appendChild(tooltipDiv);

                // Posicionamiento dinámico del tooltip (similar al anterior)
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

    inicializarTooltipsDiasHorario(); // Llamar al iniciar

});
