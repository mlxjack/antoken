(function () {
  const data = window.ANTOKEN_DATA || { items: [], groups: ["Todos"], count: 0 };
  const items = data.items || [];
  const grid = document.querySelector("#gallery-grid");
  const status = document.querySelector("#gallery-status");
  const searchInput = document.querySelector("#search-input");
  const groupSelect = document.querySelector("#group-select");
  const artCount = document.querySelector("#art-count");
  const toast = document.querySelector("#copyright-toast");
  const dialog = document.querySelector("#art-dialog");
  const dialogImage = document.querySelector("#dialog-image");
  const dialogTitle = document.querySelector("#dialog-title");
  const dialogSource = document.querySelector("#dialog-source");
  const dialogClose = document.querySelector("#dialog-close");
  const dialogPrev = document.querySelector("#dialog-prev");
  const dialogNext = document.querySelector("#dialog-next");

  let visibleItems = [...items];
  let activeIndex = 0;
  let toastTimer;

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function fillGroups() {
    const groups = ["Todos", "Novidades", ...(data.groups || []).filter((group) => group !== "Todos")];
    groupSelect.replaceChildren();
    groups.forEach((group) => {
      const option = document.createElement("option");
      option.value = group === "Novidades" ? "__new" : group;
      option.textContent = group;
      groupSelect.append(option);
    });
  }

  function cardFor(item, index) {
    const card = document.createElement("button");
    card.className = "art-card";
    card.type = "button";
    card.setAttribute("aria-label", `Abrir arte ${item.title}`);
    card.addEventListener("click", () => openDialog(index));

    const frame = document.createElement("span");
    frame.className = "art-frame";

    const image = document.createElement("img");
    image.src = item.image;
    image.alt = `Arte de token ${item.title}`;
    image.loading = "lazy";
    image.decoding = "async";
    image.draggable = false;
    image.width = item.width;
    image.height = item.height;
    frame.append(image);

    const meta = document.createElement("span");
    meta.className = "art-meta";

    const title = document.createElement("span");
    title.className = "art-title";
    title.textContent = item.title;

    const badge = document.createElement("span");
    badge.className = "art-badge";
    badge.textContent = item.isNew ? "Novo" : item.group;

    meta.append(title, badge);
    card.append(frame, meta);
    return card;
  }

  function render() {
    const term = normalize(searchInput.value);
    const selectedGroup = groupSelect.value;

    visibleItems = items.filter((item) => {
      const matchesTerm = !term || normalize(`${item.title} ${item.source} ${item.group}`).includes(term);
      const matchesGroup =
        selectedGroup === "Todos" ||
        !selectedGroup ||
        (selectedGroup === "__new" ? item.isNew : item.group === selectedGroup);
      return matchesTerm && matchesGroup;
    });

    grid.replaceChildren();
    if (!visibleItems.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Nenhuma arte encontrada com esse filtro.";
      grid.append(empty);
    } else {
      visibleItems.forEach((item, index) => grid.append(cardFor(item, index)));
    }

    const plural = visibleItems.length === 1 ? "arte encontrada" : "artes encontradas";
    status.textContent = `${visibleItems.length} ${plural}.`;
  }

  function openDialog(index) {
    activeIndex = index;
    updateDialog();
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function updateDialog() {
    const item = visibleItems[activeIndex];
    if (!item) return;
    dialogImage.src = item.image;
    dialogImage.alt = `Arte de token ${item.title}`;
    dialogTitle.textContent = item.title;
    dialogSource.textContent = item.source;
  }

  function moveDialog(direction) {
    if (!visibleItems.length) return;
    activeIndex = (activeIndex + direction + visibleItems.length) % visibleItems.length;
    updateDialog();
  }

  function showCopyrightNotice() {
    clearTimeout(toastTimer);
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
  }

  function closeDialog() {
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  fillGroups();
  render();
  if (artCount) {
    artCount.textContent = String(data.count || items.length);
  }

  searchInput.addEventListener("input", render);
  groupSelect.addEventListener("change", render);
  dialogClose.addEventListener("click", closeDialog);
  dialogPrev.addEventListener("click", () => moveDialog(-1));
  dialogNext.addEventListener("click", () => moveDialog(1));

  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    const clickedBackdrop =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;
    if (clickedBackdrop) closeDialog();
  });

  document.addEventListener("keydown", (event) => {
    if (!dialog.open) return;
    if (event.key === "ArrowLeft") moveDialog(-1);
    if (event.key === "ArrowRight") moveDialog(1);
  });

  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    showCopyrightNotice();
  });

  document.addEventListener("dragstart", (event) => {
    if (event.target instanceof HTMLImageElement) {
      event.preventDefault();
      showCopyrightNotice();
    }
  });
})();
