document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.getElementById('backButton');
    const forwardButton = document.getElementById('forwardButton');
    const upButton = document.getElementById('upButton');
    const reloadButton = document.getElementById('reloadButton');
    const pathInput = document.getElementById('pathInput');
    const fileList = document.getElementById('fileList');


    let sortColumn = 'name'; 
    let sortOrder = 'asc'; 


    const dmProtocol = 'dmfileexplorerassist://'


    fetchDefaultPaths();


    let currentPath = 'This PC'; 
    let history = [];
    let forwardHistory = [];

    loadDirectoryContents(currentPath);

    backButton.onclick = () => goBack();
    forwardButton.onclick = () => goForward();
    upButton.onclick = () => goUp();
    reloadButton.onclick = () => reload();
    pathInput.onchange = () => changeDirectory(pathInput.value);


    function changeDirectory(path) {
        if (path !== currentPath) {
            history.push(currentPath); // Adiciona o caminho atual ao histórico
            currentPath = path
            loadDirectoryContents(currentPath);
            forwardHistory = []; // Limpa o histórico de avanço
        }
    }

    function goBack() {
        if (history.length > 0) {
            const previousPath = history.pop();
            forwardHistory.push(currentPath);
            loadDirectoryContents(previousPath);
            pathInput.value = previousPath  
            currentPath = previousPath
        }
    }

    function goForward() {
        if (forwardHistory.length > 0) {
            const nextPath = forwardHistory.pop();
            history.push(currentPath);
            pathInput.value = previousPath
            currentPath = nextPath
        }
    }

    function goUp() {
        if (currentPath && currentPath !== 'This PC') {
            const upPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
            changeDirectory(upPath || 'This PC');
            console.log('Daniel Log - goUp - upPath:', upPath);
        }
    }

    function reload() {
        loadDirectoryContents(currentPath);
    }
    
    function loadDirectoryContents(path) {
        fetch(`/list-files?path=${encodeURIComponent(path)}`)
            .then(response => response.json())
            .then(entries => {
                const sortedEntries = entries.sort((a, b) => {
                let valA = a[sortColumn];
                let valB = b[sortColumn];

                if (sortColumn === 'name' || sortColumn === 'type') {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                }

                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
                fileList.innerHTML = ''; // Limpa a lista atual
                
                // Cabeçalho das colunas
                const header = document.createElement('div');
                header.className = 'file-entry header';
                header.id = 'header';
                header.innerHTML = `
                    <span class="file-name">Nome</span>
                    <span class="file-modified">Modificado</span>
                    <span class="file-type">Tipo</span>
                    <span class="file-size">Tamanho</span>
                `;
                fileList.appendChild(header);
                
                entries.forEach(entry => {
                    if (entry.name === 'desktop.ini') return; // Pula 'desktop.ini'
                    
                    const item = document.createElement('div');
                    item.className = 'file-entry';
                    item.innerHTML = `
                        <span class="file-name">${entry.name}</span>
                        <span class="file-modified">${entry.modified}</span>
                        <span class="file-type">${entry.type}</span>
                        <span class="file-size">${entry.size}</span>
                    `;
                    
                    item.onclick = () => {
                        if (entry.type === 'directory' || entry.type === 'drive') {
                            changeDirectory(entry.path);
                        } else {
                            openFile(entry.path);
                        }
                    };
                    
                    fileList.appendChild(item);
                });

                pathInput.value = path  
            })
            .catch(error => console.error('Error:', error));
        setupSorting();

    }
    

    function setupSorting() {
        const headers = document.querySelectorAll('.file-entry.header span');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const newSortColumn = header.className.split(' ')[1]; // Assume que a classe é "file-XYZ"
                if (sortColumn === newSortColumn) {
                    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumn = newSortColumn;
                    sortOrder = 'asc';
                }
                loadDirectoryContents(currentPath);
            });
        });
    }

    function fetchDefaultPaths() {
        fetch('/get-default-paths')
            .then(response => response.json())
            .then(paths => {
                const sidebar = document.getElementById('sidebar');
                for (const key in paths) {
                    const button = document.createElement('button');
                    button.textContent = key;
                    button.classList.add('sidebar-btn');
                    button.onclick = () => changeDirectory(paths[key]);
                    sidebar.appendChild(button);
                }
            })
            .catch(error => console.error('Error fetching default paths:', error));
    }


    function openFile(path) {
        // Codifica o caminho do arquivo para uso em URL
        let encodedPath = encodeURIComponent(path);
        // Constrói a URL para a requisição ao servidor Flask
        let url = `/open-file?caminho=${encodedPath}`;
    
        // Faz uma requisição fetch para abrir o arquivo
        fetch(url)
            .then(response => response.text())
            .then(result => console.log(result))
            .catch(error => console.error('Erro ao abrir o arquivo:', error));
    }
});




