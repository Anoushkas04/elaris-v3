function startBaggage() {
  const gameStart = Date.now();

  const victimNPC = [...IDENTITIES, ...GS.npcs].find(c => c.id === GS.bonfireVictim);
  const victimName = victimNPC ? victimNPC.name : 'Dr. Avery Ross';

  $('baggage-status').innerHTML = `This bag belonged to <strong style="color:var(--gold);">${victimName}</strong>. It contains the torn blocks of a map. Drag and drop or click to connect the pieces.`;

  if (!$('baggage-styles')) {
    const s = document.createElement('style');
    s.id = 'baggage-styles';
    s.textContent = `
      .map-puzzle-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        margin-top: 10px;
        user-select: none;
      }
      .map-grid {
        display: grid;
        grid-template-columns: repeat(3, 100px);
        grid-template-rows: repeat(2, 100px);
        gap: 6px;
        background: rgba(12, 10, 9, 0.6);
        padding: 10px;
        border-radius: 8px;
        border: 2px solid rgba(196, 164, 101, 0.4);
        box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.8);
      }
      .map-slot {
        width: 100px;
        height: 100px;
        border: 1.5px dashed rgba(196, 164, 101, 0.25);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(28, 25, 23, 0.3);
        position: relative;
        transition: all 0.2s;
      }
      .map-slot.dragover {
        background: rgba(196, 164, 101, 0.12);
        border-color: var(--gold-l);
      }
      .map-piece {
        width: 100px;
        height: 100px;
        border-radius: 4px;
        cursor: grab;
        background-image: url('assets/module5map.jpeg');
        background-size: 300px 200px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        box-shadow: 0 4px 8px rgba(0,0,0,0.5);
        transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
      }
      .map-piece:active {
        cursor: grabbing;
      }
      .map-piece.selected {
        border-color: var(--gold);
        box-shadow: 0 0 12px var(--gold);
        transform: scale(1.05);
        z-index: 10;
      }
      .pieces-pool {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
        width: 100%;
        max-width: 380px;
        min-height: 110px;
        background: rgba(28, 25, 23, 0.5);
        padding: 12px;
        border-radius: 8px;
        border: 1.5px solid rgba(196, 164, 101, 0.15);
      }
      .map-grid.completed {
        border-color: #10b981;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
      }
      .map-grid.completed .map-piece {
        border-color: #10b981;
        cursor: default;
      }
    `;
    document.head.appendChild(s);
  }

  // Create the Target Grid Slots
  let slotsHtml = '';
  for (let i = 0; i < 6; i++) {
    slotsHtml += `<div class="map-slot" data-slot-idx="${i}"></div>`;
  }

  $('baggage-area').innerHTML = `
    <div class="map-puzzle-container">
      <div class="map-grid" id="map-target-grid">
        ${slotsHtml}
      </div>
      <div class="pieces-pool" id="map-pieces-pool"></div>
    </div>
  `;

  // Create 6 pieces
  const pieces = [];
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const piece = document.createElement('div');
    piece.className = 'map-piece';
    piece.id = `map-piece-${i}`;
    piece.draggable = true;
    piece.dataset.correctIdx = i;
    piece.style.backgroundPosition = `-${col * 100}px -${row * 100}px`;
    pieces.push(piece);
  }

  // Shuffle pieces and append to pool
  const shuffledPieces = [...pieces].sort(() => Math.random() - 0.5);
  const pool = $('map-pieces-pool');
  shuffledPieces.forEach(p => pool.appendChild(p));

  // Selection state for click-to-swap
  let selectedPiece = null;

  // Add click to select / swap logic
  const handlePieceClick = (piece) => {
    if (!GS.gameActive) return;
    SFX.click();

    if (selectedPiece) {
      if (selectedPiece === piece) {
        // Deselect
        selectedPiece.classList.remove('selected');
        selectedPiece = null;
      } else {
        // Swap pieces between their parent containers
        const parent1 = selectedPiece.parentNode;
        const parent2 = piece.parentNode;

        // Swap DOM elements
        const temp = document.createElement('div');
        parent2.replaceChild(temp, piece);
        parent1.replaceChild(piece, selectedPiece);
        parent2.replaceChild(selectedPiece, temp);

        selectedPiece.classList.remove('selected');
        selectedPiece = null;
        checkSolution();
      }
    } else {
      selectedPiece = piece;
      selectedPiece.classList.add('selected');
    }
  };

  const handleSlotClick = (slot) => {
    if (!GS.gameActive || !selectedPiece) return;
    SFX.click();

    const parent = selectedPiece.parentNode;
    if (parent === slot) {
      // Clicked parent slot, just deselect
      selectedPiece.classList.remove('selected');
      selectedPiece = null;
      return;
    }

    // Move piece to empty slot
    slot.appendChild(selectedPiece);
    selectedPiece.classList.remove('selected');
    selectedPiece = null;
    checkSolution();
  };

  // Setup click listeners
  pieces.forEach(p => {
    p.onclick = (e) => {
      e.stopPropagation();
      handlePieceClick(p);
    };
  });

  const slots = $('map-target-grid').querySelectorAll('.map-slot');
  slots.forEach(slot => {
    slot.onclick = () => {
      handleSlotClick(slot);
    };
  });

  pool.onclick = () => {
    if (!GS.gameActive || !selectedPiece) return;
    // Move back to pool
    pool.appendChild(selectedPiece);
    selectedPiece.classList.remove('selected');
    selectedPiece = null;
    SFX.click();
    checkSolution();
  };

  // Drag and Drop Logic
  pieces.forEach(p => {
    p.addEventListener('dragstart', (e) => {
      if (!GS.gameActive) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('text/plain', p.id);
      p.classList.add('selected');
    });

    p.addEventListener('dragend', () => {
      p.classList.remove('selected');
    });
  });

  const containers = [...slots, pool];
  containers.forEach(container => {
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (container.classList.contains('map-slot')) {
        container.classList.add('dragover');
      }
    });

    container.addEventListener('dragleave', () => {
      container.classList.remove('dragover');
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      container.classList.remove('dragover');

      const id = e.dataTransfer.getData('text/plain');
      const draggedPiece = document.getElementById(id);
      if (!draggedPiece) return;

      SFX.click();

      if (container === pool) {
        pool.appendChild(draggedPiece);
      } else {
        // Drop on a slot
        if (container.children.length > 0) {
          // Slot is occupied, swap elements
          const existingPiece = container.children[0];
          const originParent = draggedPiece.parentNode;

          container.appendChild(draggedPiece);
          originParent.appendChild(existingPiece);
        } else {
          // Slot is empty
          container.appendChild(draggedPiece);
        }
      }
      checkSolution();
    });
  });

  // Check if puzzle is solved
  function checkSolution() {
    let correctCount = 0;
    slots.forEach(slot => {
      const piece = slot.children[0];
      if (piece) {
        const correctIdx = parseInt(piece.dataset.correctIdx, 10);
        const slotIdx = parseInt(slot.dataset.slotIdx, 10);
        if (correctIdx === slotIdx) {
          correctCount++;
        }
      }
    });

    if (correctCount === 6) {
      GS.gameActive = false;
      $('map-target-grid').classList.add('completed');
      
      // Disable interaction
      pieces.forEach(p => {
        p.draggable = false;
        p.onclick = null;
      });
      slots.forEach(s => s.onclick = null);
      pool.onclick = null;

      // Update decisionMaking domain
      GS.domains.decisionMaking = Math.min(100, GS.domains.decisionMaking + 16);

      // Freeze active screen
      const activeScreen = document.querySelector('.screen.game-screen');
      if (activeScreen) activeScreen.style.pointerEvents = 'none';

      SFX.success();
      setTimeout(() => {
        onModuleComplete(15, Date.now() - gameStart, true);
      }, 800);
    }
  }
}
