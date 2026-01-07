export class KeyOverlay {

    constructor(parent = document.body, abilityManager) {
        this.keys = ['W', 'A', 'S', 'D', 'E', ' '];
        this.abilityList = [
            '2x Gravity',
            '2x Jump',
            '1.5x Gravity',
            '1.5x Jump',
            '1.5x Size'
        ];

        this.abilityManager = abilityManager;

        this.keyElements = {};
        this.parent = parent;

        // ----- Overlay za tipke -----
        this.overlay = document.createElement('div');
        this.overlay.id = 'keyOverlay';
        this.overlay.style.position = 'fixed';
        this.overlay.style.bottom = '20px';
        this.overlay.style.right = '20px';
        this.overlay.style.display = 'flex';
        this.overlay.style.flexDirection = 'column';
        this.overlay.style.alignItems = 'center';
        this.overlay.style.gap = '10px';
        this.overlay.style.fontFamily = 'sans-serif';
        this.overlay.style.userSelect = 'none';
        this.overlay.style.zIndex = '100';
        parent.appendChild(this.overlay);

        // ----- W in E vrstica -----
        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.gap = '10px';
        const keyW = this.createKey('W');
        topRow.appendChild(keyW);
        const keyE = this.createKey('E');
        topRow.appendChild(keyE);
        this.overlay.appendChild(topRow);

        // ----- A S D vrstica -----
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '10px';
        ['A','S','D'].forEach(k => row.appendChild(this.createKey(k)));
        this.overlay.appendChild(row);

        // ----- SPACE tipka -----
        const keySpace = this.createKey(' ');
        keySpace.textContent = 'SPACE';
        keySpace.style.width = '160px';
        this.overlay.appendChild(keySpace);

        // ----- Ability overlay (zgornji desni kot) -----
        this.abilityOverlay = document.createElement('div');
        this.abilityOverlay.id = 'abilityOverlay';
        this.abilityOverlay.style.position = 'fixed';
        this.abilityOverlay.style.top = '20px';
        this.abilityOverlay.style.right = '20px';
        this.abilityOverlay.style.fontFamily = 'sans-serif';
        this.abilityOverlay.style.zIndex = '100';
        this.abilityOverlay.style.background = '#333';
        this.abilityOverlay.style.color = '#fff';
        this.abilityOverlay.style.padding = '10px 15px';
        this.abilityOverlay.style.borderRadius = '8px';
        this.abilityOverlay.style.display = 'none'; // sprva skrito
        this.abilityOverlay.style.fontWeight = 'bold';
        this.abilityOverlay.style.transition = 'background 0.3s';
        parent.appendChild(this.abilityOverlay);

        this.currentAbility = null; // trenutno prikazan ability

        // ----- Zvoki -----
        this.spinSound = new Audio(new URL('../../sounds/spin.mp3', import.meta.url));
        this.spinSound.volume = 0.7;
        this.selectSound = new Audio(new URL('../../sounds/select.mp3', import.meta.url));
        this.selectSound.volume = 0.8;

        // ----- Dodamo CSS za tipke -----
        const style = document.createElement('style');
        style.textContent = `
            .key {
                width: 50px;
                height: 50px;
                background-color: #555;
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                border-radius: 8px;
                font-weight: bold;
                transition: background-color 0.1s;
            }
            .key.active {
                background-color: rgba(154, 154, 154, 1);
                color: white;
            }
        `;
        document.head.appendChild(style);

        // ----- Event listenerji -----
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    createKey(k) {
        const el = document.createElement('div');
        el.className = 'key';
        el.id = k === ' ' ? 'keySpace' : 'key' + k;
        el.textContent = k === ' ' ? 'SPACE' : k;
        this.keyElements[k] = el;
        return el;
    }

    onKeyDown(e) {
        const key = e.key.toUpperCase();
        if (this.keyElements[key]) this.keyElements[key].classList.add('active');
        if (key === ' ' && this.keyElements[' ']) this.keyElements[' '].classList.add('active');

        // Če je pritisnjen E, pokaži ali skrij naključni ability
        if (key === 'E') this.toggleAbility();
    }

    onKeyUp(e) {
        const key = e.key.toUpperCase();
        if (this.keyElements[key]) this.keyElements[key].classList.remove('active');
        if (key === ' ' && this.keyElements[' ']) this.keyElements[' '].classList.remove('active');
    }

    toggleAbility() {
        if (this.currentAbility) {
            // Če že nekaj prikazano, skrijemo
            this.abilityOverlay.style.display = 'none';
            this.currentAbility = null;
        } else {
            // Pokaži overlay
            this.abilityOverlay.style.display = 'block';

            // Animacija vrtenja
            const spinCount = 35; // koliko “vrtenj”
            let currentIndex = 0;
            this.spinSound.currentTime = 0;
            this.spinSound.play();

            const interval = setInterval(() => {
                this.abilityOverlay.textContent = this.abilityList[currentIndex];
                currentIndex = (currentIndex + 1) % this.abilityList.length;
            }, 100);

            setTimeout(() => {
                clearInterval(interval);

                // Naključni končni ability
                const finalIndex = Math.floor(Math.random() * this.abilityList.length);
                const finalAbility = this.abilityList[finalIndex];
                this.currentAbility = finalAbility;
                this.abilityOverlay.textContent = finalAbility;

                // Zvok izbire
                this.selectSound.currentTime = 0;
                this.selectSound.play();

                // Flash efekt
                this.abilityOverlay.style.background = '#FFD700';
                setTimeout(() => {
                    this.abilityOverlay.style.background = '#333';
                }, 500);

                // Obvesti AbilityManager
                if (this.abilityManager) {
                    this.abilityManager.setAbility(finalAbility);
                }

            }, spinCount * 100);
        }
    }

}
