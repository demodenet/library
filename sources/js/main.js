import Reader from "./components/reader";
import Library from "./components/library";
// import Book from './components/book';


class App {
    constructor() {
        this.init();
    }

    init() {
        let firstReader = new Reader(1, 'Sylwia', 'Rybicka');

        /*let library =*/
        new Library();

        console.log(firstReader);
    }
}

document.addEventListener('DOMContentLoaded', () => new App());

