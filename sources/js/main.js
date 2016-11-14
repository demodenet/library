import Component from './components/component';
import Reader from './components/reader';
import Book from './components/book';

class App {
    constructor() {
        this.init();
    }

    init() {
        let component = new Component();
        let firstReader = new Reader(1, 'Sylwia', 'Rybicka');
        let newBook = new Book('Abecadło');

        component.printMessage();
        console.log(firstReader);
        console.log(newBook);
    }
}

document.addEventListener('DOMContentLoaded', () => new App());

