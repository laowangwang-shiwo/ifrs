/* ==============================================
   IFRS Calculator — Navigation & App Logic
   ============================================== */

(function () {
  'use strict';

  // --- Elements ---
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const chapterLinks = document.querySelectorAll('.chapter-link');
  const chapterPanels = document.querySelectorAll('.chapter-panel');

  // --- Chapter navigation ---
  chapterLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var chapter = this.getAttribute('data-chapter');
      switchChapter(chapter);
      // Close mobile sidebar after selection
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
      }
    });
  });

  function switchChapter(chapterId) {
    // Update sidebar active state
    chapterLinks.forEach(function (l) {
      l.classList.toggle('active', l.getAttribute('data-chapter') === chapterId);
    });
    // Show matching panel
    chapterPanels.forEach(function (p) {
      p.classList.toggle('active', p.id === 'chapter-' + chapterId);
    });
  }

  // --- Mobile menu toggle ---
  menuToggle.addEventListener('click', function () {
    sidebar.classList.toggle('open');
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', function (e) {
    if (window.innerWidth <= 768 &&
        !sidebar.contains(e.target) &&
        e.target !== menuToggle) {
      sidebar.classList.remove('open');
    }
  });

})();
