export class AbilityManager {
    constructor() {
        this.activeAbility = null;

        this.gravityMult = 1;
        this.jumpMult = 1;
        this.sizeMult = 1;
    }

    setAbility(name) {
        this.reset();

        this.activeAbility = name;

        switch (name) {
            case '2x Gravity':
                this.gravityMult = 2;
                break;

            case '1.5x Gravity':
                this.gravityMult = 1.5;
                break;

            case '2x Jump':
                this.jumpMult = 2;
                break;

            case '1.5x Jump':
                this.jumpMult = 1.5;
                break;

            case '1.5x Size':
                this.sizeMult = 1.5;
                break;
        }
    }

    reset() {
        this.activeAbility = null;
        this.gravityMult = 1;
        this.jumpMult = 1;
        this.sizeMult = 1;
    }
}
