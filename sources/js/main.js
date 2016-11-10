import Component from './components/component';

class App {
    constructor() {
        this.init();
    }

    init() {
        let component = new Component();

        component.printMessage();
    }
}

document.addEventListener('DOMContentLoaded', () => new App());
