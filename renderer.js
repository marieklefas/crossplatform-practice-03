const listButton = document.getElementById('listButton');
const fileList = document.getElementById('fileList');

async function showDirectory() {
  const entries = await window.api.listDir('.');
  fileList.innerHTML = '';

  for (const entry of entries) {
    const item = document.createElement('li');
    item.textContent = `${entry.isDir ? '📁' : '📄'} ${entry.name}`;
    if (entry.isDir) item.classList.add('directory');
    fileList.appendChild(item);
  }
}

listButton.addEventListener('click', showDirectory);
