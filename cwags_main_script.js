// cwags_main_script.js

let currentPage = 1;

function renderDogTable() {
  const pageSize = parseInt(document.getElementById('pageSize').value, 10);
  const tableBody = document.getElementById('dogRecordsTable');
  const recordCount = document.getElementById('recordCount');
  const pageIndicator = document.getElementById('pageIndicator');

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const currentDogs = dogData.slice(start, end);

  tableBody.innerHTML = currentDogs.map(dog => `
    <tr>
      <td>${dog.id || 'N/A'}</td>
      <td>${dog.callName || 'N/A'}</td>
      <td>${dog.fullName || 'N/A'}</td>
      <td>${dog.handlerFullName || \`\${dog.handlerFirstName || ''} \${dog.handlerLastName || ''}\`.trim() || 'N/A'}</td>
      <td>${dog.className || 'N/A'}</td>
      <td>${dog.judgeName || 'N/A'}</td>
      <td><button onclick="selectDogForEntry('${dog.id}')">Select</button></td>
    </tr>
  `).join('');

  recordCount.textContent = `(${dogData.length} total records)`;
  const totalPages = Math.ceil(dogData.length / pageSize);
  pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
}

function changePage(delta) {
  const pageSize = parseInt(document.getElementById('pageSize').value, 10);
  const maxPage = Math.ceil(dogData.length / pageSize);
  currentPage = Math.max(1, Math.min(currentPage + delta, maxPage));
  renderDogTable();
}

function selectDogForEntry(dogId) {
  const dog = dogData.find(d => d.id === dogId);
  if (!dog) return;
  alert(`Selected dog: ${dog.callName}`);
}
