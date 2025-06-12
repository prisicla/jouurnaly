document.addEventListener('DOMContentLoaded', () => {
    // --- Utilidades y Constantes ---
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const MAX_TAREA_LENGTH = 100;
    // ¡IMPORTANTE! Reemplaza 'TU_API_KEY_AQUI' con tu clave real de OpenWeatherMap
    const API_KEY_WEATHER = '671f6a470eba37e2e650177a9d2e16cf'; 

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
    const tooltip = document.getElementById('tooltip'); // Tooltip general del header
    const mainHeaderTitle = document.querySelector('header.main-header h1');

    // Tareas
    const formTarea = document.getElementById('formTarea');
    const listaTareas = document.getElementById('listaTareas');
    const btnEliminarTareas = document.getElementById('btnEliminarTareas');
    let tareasGuardadas = []; // Se cargan con loadData al inicio

    // Notas
    const formNota = document.getElementById('formNota');
    const listaNotas = document.getElementById('listaNotas');
    const btnEliminarNotas = document.getElementById('btnEliminarNotas');
    let notasGuardadas = []; // Se cargan con loadData al inicio

    // Exámenes
    const formExamen = document.getElementById('formExamen');
    const listaExamenes = document.getElementById('listaExamenes');
    let examenesGuardados = []; // Se cargan con loadData y se filtran al inicio

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
        // Recargar la sección "Hoy" solo si es pertinente (no en cada pequeña actualización de datos)
        // La sección "Hoy" se actualizará al cargarExamenes, cargarNotas, cargarTareas.
        if (key === 'tareas' || key === 'notas' || key === 'examenes') {
            loadTasksForDay(currentDisplayedDate);
        }
    };

    const loadData = (key) => {
        return JSON.parse(localStorage.getItem(key)) || [];
    };

    // --- NOTAS ---
    const crearNotaElemento = (materia, texto, fecha, marcada = false) => {
        const li = document.createElement('li');
        li.dataset.materia = materia;
        li.dataset.fecha = fecha; // Almacenar la fecha original YYYY-MM-DD
        const uniqueId = generarId(); // Generar ID único para cada checkbox y label
        li.innerHTML = `
            <input type="checkbox" id="nota-${uniqueId}" ${marcada ? 'checked' : ''}>
            <label for="nota-${uniqueId}">
                <span class="nota-materia">${materia.charAt(0).toUpperCase() + materia.slice(1)}:</span>
                <span class="nota-texto">${texto}</span>
                ${fecha ? `<span class="nota-fecha"> (${new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })})</span>` : ''}
            </label>
        `;
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
        loadTasksForDay(currentDisplayedDate); // Actualizar sección "Hoy" después de cargar
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

        notasGuardadas.push({ materia, texto, fecha, marcada: false });
        saveData('notas', notasGuardadas);
        cargarNotas(); // Volver a cargar para reflejar el estado actual
        formNota.reset();
    });

    btnEliminarNotas?.addEventListener('click', () => {
        if (!listaNotas) return;
        const itemsToDelete = Array.from(listaNotas.querySelectorAll('input:checked'));
        if (itemsToDelete.length === 0) {
            alert('No hay notas seleccionadas para eliminar.');
            return;
        }
        
        // Filtra las notas del array guardado que no estén marcadas en la UI
        notasGuardadas = notasGuardadas.filter((nota) => {
            // Encuentra el li correspondiente a esta nota guardada
            const correspondingLi = Array.from(listaNotas.children).find(li => {
                const label = li.querySelector('label');
                const materiaText = li.dataset.materia;
                const noteText = label ? label.querySelector('.nota-texto')?.textContent : '';
                const noteDate = li.dataset.fecha;

                // Comparación más robusta
                return normalizarString(materiaText) === normalizarString(nota.materia) &&
                       normalizarString(noteText) === normalizarString(nota.texto) &&
                       (noteDate === nota.fecha);
            });
            // Si el li existe y su checkbox NO está marcado, entonces mantenlo
            return correspondingLi ? !correspondingLi.querySelector('input')?.checked : true;
        });

        saveData('notas', notasGuardadas);
        cargarNotas(); // Volver a cargar para reflejar el estado actual
    });

    listaNotas?.addEventListener('change', (e) => {
        if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
            const listItem = e.target.closest('li');
            const labelElement = listItem.querySelector('label');
            const materiaText = listItem.dataset.materia;
            const noteText = labelElement ? labelElement.querySelector('.nota-texto')?.textContent : '';
            const noteDate = listItem.dataset.fecha;

            // Encuentra la nota específica en el array basándose en el contenido o data-set
            const notaIndex = notasGuardadas.findIndex(nota =>
                normalizarString(nota.materia) === normalizarString(materiaText) &&
                normalizarString(nota.texto) === normalizarString(noteText) &&
                nota.fecha === noteDate
            );

            if (notaIndex > -1) {
                notasGuardadas[notaIndex].marcada = e.target.checked;
                saveData('notas', notasGuardadas);
            }
        }
    });

    cargarNotas(); // Cargar notas al inicio

    // --- TAREAS ---
    const crearTareaElemento = (materia, texto, id, completada = false) => {
        const li = document.createElement('li');
        li.dataset.materia = materia;
        li.dataset.id = id; // Almacena el ID único para referencia
        li.setAttribute('role', 'listitem');
        li.innerHTML = `
            <input type="checkbox" id="${id}" ${completada ? 'checked' : ''} aria-label="Marcar tarea como completada">
            <label for="${id}" class="${completada ? 'completed' : ''}">
                ${materia === 'general' ? '<span class="sr-only">General:</span>' : `<span class="tarea-materia">${materia.charAt(0).toUpperCase() + materia.slice(1)}:</span>`}
                <span class="tarea-texto">${texto}</span>
            </label>
        `;
        return li;
    };

    const cargarTareas = () => {
        if (!listaTareas) return;
        listaTareas.innerHTML = '';
        tareasGuardadas = loadData('tareas'); // Asegura que carga lo último
        if (tareasGuardadas.length === 0) {
            const noTasksMessage = document.createElement('li');
            noTasksMessage.classList.add('no-items');
            noTasksMessage.textContent = 'No hay tareas pendientes.';
            listaTareas.appendChild(noTasksMessage);
        } else {
            tareasGuardadas.forEach(({ id, materia, texto, completada }) => {
                listaTareas.appendChild(crearTareaElemento(materia, texto, id, completada));
            });
        }
        loadTasksForDay(currentDisplayedDate); // Actualizar sección "Hoy" después de cargar
    };

    formTarea?.addEventListener('submit', e => {
        e.preventDefault();
        const materia = document.getElementById('materiaSelect').value;
        const texto = document.getElementById('inputTarea').value.trim();

        if (!texto || texto.length > MAX_TAREA_LENGTH || !materia) {
            alert('Por favor, selecciona una materia y escribe una tarea (máx. 100 caracteres).');
            return;
        }

        const nuevaTarea = { id: generarId(), materia, texto, completada: false };
        tareasGuardadas.push(nuevaTarea);
        saveData('tareas', tareasGuardadas);
        cargarTareas(); // Recargar para reflejar el estado actual
        formTarea.reset();
    });

    btnEliminarTareas?.addEventListener('click', () => {
        if (!listaTareas) return;
        const itemsToDelete = Array.from(listaTareas.querySelectorAll('input:checked'));
        if (itemsToDelete.length === 0) {
            alert('No hay tareas completadas para eliminar.');
            return;
        }
        
        tareasGuardadas = tareasGuardadas.filter(tarea => {
            // Busca si el ID de la tarea guardada existe en los checkboxes marcados
            return !itemsToDelete.some(checkbox => checkbox.id === tarea.id);
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

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Establecer la hora a medianoche para comparar solo la fecha

        // Filtrar exámenes: mantener solo aquellos cuya fecha es hoy o en el futuro
        const filteredExamenes = examenesGuardados.filter(examen => {
            const examenDate = new Date(examen.fecha);
            examenDate.setHours(0, 0, 0, 0); // Establecer la hora a medianoche
            return examenDate >= today;
        });

        // Actualizar la variable global y localStorage con los exámenes filtrados
        examenesGuardados = filteredExamenes;
        saveData('examenes', examenesGuardados); // Guarda la lista filtrada de nuevo en localStorage

        // Ordenar exámenes por fecha ascendente para mostrarlos correctamente
        examenesGuardados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        if (examenesGuardados.length === 0) {
            listaExamenes.innerHTML = '<li class="no-items">No hay exámenes programados.</li>';
        } else {
            examenesGuardados.forEach(({ materia, texto, fecha }) => {
                listaExamenes.appendChild(crearExamenElemento(materia, texto, fecha));
            });
        }
        loadTasksForDay(currentDisplayedDate); // Actualizar sección "Hoy" después de cargar
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

        const newExamenDate = new Date(fecha);
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        if (newExamenDate < today) {
            alert('No puedes agregar un examen con una fecha pasada.');
            return;
        }

        examenesGuardados.push({ materia, texto, fecha });
        saveData('examenes', examenesGuardados);
        cargarExamenes(); // Recargar para reflejar el estado actual y el orden
        formExamen.reset();
    });

    cargarExamenes(); // Cargar y filtrar exámenes al inicio de la aplicación

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
            // console.log(`No se encontró la columna para el día: ${currentDayNameRaw} en el horario.`);
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
        const todayAtMidnight = new Date(hoyStr); // Objeto Date para el día actual sin tiempo

        let itemsFound = false;

        // Tareas para "Hoy"
        tareasGuardadas.forEach(item => {
            const itemMateriaNormalized = normalizarString(item.materia || '');
            const isMateriaForToday = materiasDelDia.includes(itemMateriaNormalized) || itemMateriaNormalized === 'general';
            
            // Si la tarea no está completada y corresponde a una materia del día o es general
            if (!item.completada && isMateriaForToday) {
                const listItem = document.createElement('li');
                const materiaDisplay = item.materia === 'general' ? 'General' : item.materia.charAt(0).toUpperCase() + item.materia.slice(1);
                listItem.textContent = `${materiaDisplay}: Tarea - ${item.texto}`;
                listaHoyElement.appendChild(listItem);
                itemsFound = true;
            }
        });

        // Notas para "Hoy"
        notasGuardadas.forEach(item => {
            const itemMateriaNormalized = normalizarString(item.materia || '');
            const isMateriaForToday = materiasDelDia.includes(itemMateriaNormalized) || itemMateriaNormalized === 'general';
            const noteDate = item.fecha ? new Date(item.fecha) : null;
            if (noteDate) noteDate.setHours(0,0,0,0); // Normalizar a medianoche

            // Mostrar si no está marcada y (su materia es del día O tiene fecha y es HOY)
            if (!item.marcada && (isMateriaForToday || (noteDate && noteDate.toDateString() === todayAtMidnight.toDateString()))) {
                const listItem = document.createElement('li');
                const materiaDisplay = item.materia === 'general' ? 'General' : item.materia.charAt(0).toUpperCase() + item.materia.slice(1);
                const fechaTexto = item.fecha ? ` (Fecha: ${new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })})` : '';
                listItem.textContent = `${materiaDisplay}: Nota - ${item.texto}${fechaTexto}`;
                listaHoyElement.appendChild(listItem);
                itemsFound = true;
            }
        });

        // Exámenes para "Hoy" (solo si su fecha es hoy o en el futuro)
        examenesGuardados.forEach(item => {
            const itemMateriaNormalized = normalizarString(item.materia || '');
            const isMateriaForToday = materiasDelDia.includes(itemMateriaNormalized);
            const examDate = new Date(item.fecha);
            examDate.setHours(0,0,0,0); // Normalizar a medianoche

            // Solo muestra exámenes que no han pasado (ya se filtraron, pero doble chequeo)
            // Y que su fecha es el día que estamos viendo en la sección "Hoy" O su materia es del día actual
            if (examDate >= todayAtMidnight && (isMateriaForToday || examDate.toDateString() === todayAtMidnight.toDateString())) { 
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
            let enterTimeout; // Temporizador para mouseenter

            celda.addEventListener('mouseenter', (event) => {
                clearTimeout(enterTimeout); // Limpiar cualquier timeout anterior

                enterTimeout = setTimeout(() => { // Retraso para mostrar el tooltip
                    const materiaTexto = celda.dataset.materia || celda.textContent.trim();
                    if (!materiaTexto || normalizarString(materiaTexto) === 'recreo' || normalizarString(materiaTexto) === 'libre' || materiaTexto.trim() === "") {
                        return;
                    }

                    const materiaNorm = normalizarString(materiaTexto);
                    // Filtrar tareas, notas y exámenes por la materia de la celda y que no estén completadas
                    const itemsPendientes = [];

                    // Tareas no completadas
                    tareasGuardadas.filter(t => normalizarString(t.materia) === materiaNorm && !t.completada)
                                   .forEach(t => itemsPendientes.push(`Tarea: ${t.texto}`));

                    // Notas no marcadas
                    notasGuardadas.filter(n => normalizarString(n.materia) === materiaNorm && !n.marcada)
                                  .forEach(n => itemsPendientes.push(`Nota: ${n.texto} ${n.fecha ? `(Fecha: ${new Date(n.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })})` : ''}`));

                    // Exámenes no pasados (ya filtrados en examenesGuardados, solo verificar la materia)
                    examenesGuardados.filter(ex => normalizarString(ex.materia) === materiaNorm)
                                     .forEach(ex => itemsPendientes.push(`Examen: ${ex.texto} (Fecha: ${new Date(ex.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })})`));

                    tooltipDiv = document.createElement('div');
                    tooltipDiv.className = 'tooltip'; // No 'show' inicialmente, se añade después de posicionar

                    if (itemsPendientes.length > 0) {
                        tooltipDiv.innerHTML = `<strong>${itemsPendientes.length === 1 ? 'Elemento pendiente:' : 'Elementos pendientes:'}</strong><br>${itemsPendientes.join('<br>')}`;
                    } else {
                        tooltipDiv.innerHTML = `<em>No se registran elementos pendientes para esta materia.</em>`;
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
                    tooltipDiv.classList.add('show'); // Ahora sí, mostrarlo
                }, 500); // 500ms de retraso
            });

            celda.addEventListener('mouseleave', () => {
                clearTimeout(enterTimeout); // Limpiar el timeout si el mouse se va antes de que aparezca
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
            // Ignorar la primera columna (Hora) y columnas sin texto o fuera del rango de días
            if (colIndex === 0 || !thElement.textContent.trim() || colIndex > dayNames.length) { 
                return;
            }

            let tooltipDiv = null;
            let enterTimeout; // Temporizador para mouseenter

            thElement.addEventListener('mouseenter', () => {
                clearTimeout(enterTimeout);

                enterTimeout = setTimeout(() => {
                    const dayNameForColumn = normalizarString(thElement.textContent);
                    
                    // Obtener todas las materias asociadas a este día (columna) en el horario
                    const materiasDeColumna = new Set();
                    filas.forEach(fila => {
                        const cell = fila.children[colIndex];
                        if (cell) {
                            const materia = cell.dataset.materia || cell.textContent?.trim();
                            if (materia && normalizarString(materia) !== 'recreo' && normalizarString(materia) !== 'libre' && materia.trim() !== '') {
                                materiasDeColumna.add(normalizarString(materia));
                            }
                        }
                    });

                    // Si no hay materias para este día en el horario, no mostrar tooltip
                    if (materiasDeColumna.size === 0) return;

                    const itemsPendientesDia = [];
                    
                    // Tareas pendientes para las materias de este día o tareas generales
                    tareasGuardadas.filter(t => 
                        (materiasDeColumna.has(normalizarString(t.materia)) || normalizarString(t.materia) === 'general') && !t.completada
                    ).forEach(t => {
                        const materiaDisplay = t.materia === 'general' ? 'General' : t.materia.charAt(0).toUpperCase() + t.materia.slice(1);
                        itemsPendientesDia.push(`Tarea: ${t.texto} (${materiaDisplay})`);
                    });
                    
                    // Notas pendientes para las materias de este día o notas generales
                    notasGuardadas.filter(n =>
                        (materiasDeColumna.has(normalizarString(n.materia)) || normalizarString(n.materia) === 'general') && !n.marcada
                    ).forEach(n => {
                        const materiaDisplay = n.materia === 'general' ? 'General' : n.materia.charAt(0).toUpperCase() + n.materia.slice(1);
                        const fechaTexto = n.fecha ? ` (Fecha: ${new Date(n.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })})` : '';
                        itemsPendientesDia.push(`Nota: ${n.texto} (${materiaDisplay})${fechaTexto}`);
                    });

                    // Exámenes pendientes para las materias de este día (ya auto-eliminados si pasaron)
                    examenesGuardados.filter(ex =>
                        materiasDeColumna.has(normalizarString(ex.materia))
                    ).forEach(ex => {
                        const materiaDisplay = ex.materia.charAt(0).toUpperCase() + ex.materia.slice(1);
                        const fechaTexto = ` (Fecha: ${new Date(ex.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })})`;
                        itemsPendientesDia.push(`Examen: ${ex.texto} (${materiaDisplay})${fechaTexto}`);
                    });

                    tooltipDiv = document.createElement('div');
                    tooltipDiv.className = 'tooltip';

                    if (itemsPendientesDia.length > 0) {
                        tooltipDiv.innerHTML = `<strong>Elementos pendientes para ${thElement.textContent.trim()}:</strong><br>${itemsPendientesDia.join('<br>')}`;
                    } else {
                        tooltipDiv.innerHTML = `<em>No hay elementos pendientes para ${thElement.textContent.trim()}.</em>`;
                    }

                    document.body.appendChild(tooltipDiv);

                    const rect = thElement.getBoundingClientRect();
                    tooltipDiv.style.position = 'absolute';
                    tooltipDiv.style.zIndex = '2000';

                    let top = rect.bottom + window.scrollY + 8;
                    let left = rect.left + window.scrollX + (rect.width - tooltipDiv.offsetWidth) / 2;

                    // Ajustes para que no se salga de la pantalla
                    if (left < 0) { left = 5; }
                    if (left + tooltipDiv.offsetWidth > window.innerWidth) {
                        left = window.innerWidth - tooltipDiv.offsetWidth - 5;
                    }

                    tooltipDiv.style.top = `${top}px`;
                    tooltipDiv.style.left = `${left}px`;
                    tooltipDiv.classList.add('show');
                }, 500); // 500ms de retraso
            });

            thElement.addEventListener('mouseleave', () => {
                clearTimeout(enterTimeout);
                if (tooltipDiv) {
                    tooltipDiv.classList.remove('show');
                    setTimeout(() => tooltipDiv?.remove(), 300);
                    tooltipDiv = null;
                }
            });
        });
    };

    inicializarTooltipsDiasHorario(); // Inicializar tooltips en los encabezados de los días

    // --- Inicializar inputs de fecha con la fecha actual ---
    const initializeDateInput = (id) => {
        const input = document.getElementById(id);
        if (input) {
            const today = new Date();
            input.value = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        }
    };

    initializeDateInput('fechaNota');
    initializeDateInput('fechaExamen');
    // Si tienes un input de fecha para tareas, descomenta la siguiente línea:
    // initializeDateInput('fechaTarea'); 
});
