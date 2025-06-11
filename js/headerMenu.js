// headerMenu.js - Handles avatar dropdown and header interactivity

document.addEventListener('DOMContentLoaded', () => {
    const avatarDropdown = document.querySelector('.avatar-dropdown');
    const avatarBtn = document.getElementById('avatarBtn');
    const avatarMenu = document.getElementById('avatarMenu');

    if (avatarBtn && avatarDropdown && avatarMenu) {
        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            avatarDropdown.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!avatarDropdown.contains(e.target)) {
                avatarDropdown.classList.remove('open');
            }
        });
    }
});
