const API_BASE = "";

const apiKeyInput = document.getElementById("apiKeyInput");

apiKeyInput.value = localStorage.getItem("apiKey") || "";

apiKeyInput.addEventListener("change", () => {
  localStorage.setItem("apiKey", apiKeyInput.value);
});

async function fetchJson(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.method && options.method !== "GET") {
    headers["X-API-Key"] = apiKeyInput.value;
  }
  const res = await fetch(url, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body?.error?.message || `Ошибка ${res.status}`;
    throw new Error(message);
  }
  return body;
}

async function loadEquipmentOptions() {
  const { data } = await fetchJson(`${API_BASE}/api/equipment?limit=100`);
  const options = data
    .map(
      (e) => `<option value="${e.id}">${e.name} (${e.serialNumber})</option>`,
    )
    .join("");
  document
    .getElementById("filterEquipment")
    .insertAdjacentHTML("beforeend", options);
  document.getElementById("newEquipment").innerHTML = options;
  return data;
}

function statusBadge(status) {
  return `<span class="badge status-${status}">${status}</span>`;
}

async function loadRequests() {
  const listError = document.getElementById("listError");
  listError.textContent = "";

  const status = document.getElementById("filterStatus").value;
  const priority = document.getElementById("filterPriority").value;
  const equipmentId = document.getElementById("filterEquipment").value;

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);
  if (equipmentId) params.set("equipmentId", equipmentId);

  try {
    const { data } = await fetchJson(
      `${API_BASE}/api/requests?${params.toString()}`,
    );
    const tbody = document.getElementById("requestsBody");

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">Заявок не найдено</td></tr>';
      return;
    }

    tbody.innerHTML = data
      .map(
        (r) => `
        <tr>
          <td>${r.title}</td>
          <td>${r.equipmentId}</td>
          <td>${r.priority}</td>
          <td>${statusBadge(r.status)}</td>
          <td>${nextActionButton(r)}</td>
        </tr>
      `,
      )
      .join("");

    tbody.querySelectorAll("[data-transition]").forEach((btn) => {
      btn.addEventListener("click", () =>
        changeStatus(btn.dataset.id, btn.dataset.transition),
      );
    });
  } catch (err) {
    listError.textContent = err.message;
  }
}

function nextActionButton(r) {
  const nextStatus = { new: "in_progress", in_progress: "done" }[r.status];
  if (!nextStatus) return "—";
  return `<button data-id="${r.id}" data-transition="${nextStatus}">→ ${nextStatus}</button>`;
}

async function changeStatus(id, status) {
  try {
    await fetchJson(`${API_BASE}/api/requests/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadRequests();
  } catch (err) {
    document.getElementById("listError").textContent = err.message;
  }
}

async function createRequest() {
  const formError = document.getElementById("formError");
  const formSuccess = document.getElementById("formSuccess");
  formError.textContent = "";
  formSuccess.textContent = "";

  const payload = {
    equipmentId: document.getElementById("newEquipment").value,
    title: document.getElementById("newTitle").value,
    priority: document.getElementById("newPriority").value,
    description: document.getElementById("newDescription").value || undefined,
  };

  try {
    await fetchJson(`${API_BASE}/api/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    formSuccess.textContent = "Заявка создана";
    document.getElementById("newTitle").value = "";
    document.getElementById("newDescription").value = "";
    await loadRequests();
  } catch (err) {
    formError.textContent = err.message;
  }
}

document.getElementById("applyFilters").addEventListener("click", loadRequests);
document.getElementById("createBtn").addEventListener("click", createRequest);

(async () => {
  await loadEquipmentOptions();
  await loadRequests();
})();
