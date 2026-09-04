(function () {
  const data = window.ANTOKEN_DATA || { collections: [], whatsappDisplay: "" };
  const collections = data.collections || [];

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
  }

  function showCopyrightNotice() {
    const toast = document.querySelector("#copyright-toast");
    if (!toast) return;
    clearTimeout(showCopyrightNotice._timer);
    toast.classList.add("is-visible");
    showCopyrightNotice._timer = window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
  }

  // One gallery controller per collection: grid + optional filters + lightbox dialog.
  function initGallery(collection) {
    const root = document.querySelector(`[data-collection="${collection.id}"]`);
    if (!root) return;

    const items = collection.items || [];
    const grid = root.querySelector("[data-grid]");
    const status = root.querySelector("[data-status]");
    const searchInput = root.querySelector("[data-search]");
    const groupSelect = root.querySelector("[data-group-select]");
    const countEl = root.querySelector("[data-count]");

    const dialog = document.querySelector(`[data-dialog][data-dialog-for="${collection.id}"]`);
    if (!dialog) return;
    const dialogImage = dialog.querySelector("[data-dialog-image]");
    const dialogTitle = dialog.querySelector("[data-dialog-title]");
    const dialogSource = dialog.querySelector("[data-dialog-source]");
    const dialogClose = dialog.querySelector("[data-dialog-close]");
    const dialogPrev = dialog.querySelector("[data-dialog-prev]");
    const dialogNext = dialog.querySelector("[data-dialog-next]");

    let visibleItems = [...items];
    let activeIndex = 0;

    if (countEl) countEl.textContent = String(items.length);

    if (groupSelect) {
      const groups = ["Todos", "Novidades", ...(collection.groups || []).filter((g) => g !== "Todos")];
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
      badge.textContent = collection.groups
        ? item.isNew
          ? "Novo"
          : item.group
        : String(item.index).padStart(2, "0") + "/" + String(items.length).padStart(2, "0");

      meta.append(title, badge);
      card.append(frame, meta);
      return card;
    }

    function render() {
      const term = normalize(searchInput ? searchInput.value : "");
      const selectedGroup = groupSelect ? groupSelect.value : "Todos";

      visibleItems = items.filter((item) => {
        const matchesTerm = !term || normalize(`${item.title} ${item.source} ${item.group}`).includes(term);
        const matchesGroup =
          !groupSelect ||
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

      if (status) {
        const plural = visibleItems.length === 1 ? "arte encontrada" : "artes encontradas";
        status.textContent = `${visibleItems.length} ${plural}.`;
      }
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

    function closeDialog() {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }

    render();

    if (searchInput) searchInput.addEventListener("input", render);
    if (groupSelect) groupSelect.addEventListener("change", render);
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

    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") moveDialog(-1);
      if (event.key === "ArrowRight") moveDialog(1);
    });
  }

  collections.forEach(initGallery);

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
