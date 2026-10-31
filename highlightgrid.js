// Highlight grid: vanilla port of VengeanceUI's HighlightGrid.
//
//   <div class="hl-grid" data-colors="#e62e3d,#b3122a">
//     <div class="hl-row"><div class="hl-cell" data-color="#ff5a4f"><p>( python )</p></div> ...</div>
//   </div>
//
// One coloured highlight glides behind whichever cell is hovered (or focused), morphing its
// position, size and colour with a CSS transition. It parks on the first cell on load and
// stays aligned on resize. Cells marked .hl-label are headings and never take the highlight.
(function () {
  document.querySelectorAll('.hl-grid').forEach(grid => {
    const palette = (grid.dataset.colors || '#E24E1B,#4381C1,#F79824,#04A777').split(',').map(c => c.trim());
    const duration = +grid.dataset.transitionDuration || 250;
    const cells = [...grid.querySelectorAll('.hl-cell:not(.hl-label)')];
    if (!cells.length) return;

    const highlight = document.createElement('div');
    highlight.className = 'hl-highlight';
    highlight.setAttribute('aria-hidden', 'true');
    highlight.style.transitionDuration = `${duration}ms`;
    grid.prepend(highlight);

    cells.forEach((cell, i) => { cell.dataset.color ||= palette[i % palette.length]; });
    let active = null;

    function moveTo(cell) {
      const rect = cell.getBoundingClientRect();
      const g = grid.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      highlight.style.opacity = '1';
      highlight.style.transform = `translate(${rect.left - g.left - grid.clientLeft}px, ${rect.top - g.top - grid.clientTop}px)`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;
      highlight.style.backgroundColor = cell.dataset.color;
      active?.classList.remove('is-active');
      cell.classList.add('is-active');
      active = cell;
    }

    cells.forEach(cell => {
      cell.tabIndex = 0;
      cell.addEventListener('pointerenter', () => moveTo(cell));
      cell.addEventListener('focus', () => moveTo(cell));
    });

    // Park on the first cell without animating, then enable the transition.
    requestAnimationFrame(() => {
      highlight.style.transitionDuration = '0s';
      moveTo(cells[0]);
      requestAnimationFrame(() => { highlight.style.transitionDuration = `${duration}ms`; });
    });

    let raf = 0;
    const realign = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => active && moveTo(active));
    };
    new ResizeObserver(realign).observe(grid);
    addEventListener('resize', realign);
  });
})();
